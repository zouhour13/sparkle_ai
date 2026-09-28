import io
import json
import re
import asyncio
import base64

import truststore
from fastapi import HTTPException
from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError
from PIL import Image
from starlette.concurrency import run_in_threadpool

from ..config import Settings

# Use the Windows certificate store for corporate or local HTTPS inspection
# certificates while preserving certificate verification.
truststore.inject_into_ssl()


def normalize_jpeg(content: bytes) -> bytes:
    with Image.open(io.BytesIO(content)) as image:
        image = image.convert("RGB")
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=92, optimize=True)
        return output.getvalue()


def describe_image(content: bytes, content_type: str, token: str, model: str) -> str:
    image_url = f"data:{content_type};base64,{base64.b64encode(content).decode('ascii')}"
    client = InferenceClient(provider="auto", api_key=token)
    completion = client.chat_completion(
        model=model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": image_url}},
                    {
                        "type": "text",
                        "text": (
                            "Describe this product image precisely for a product listing. "
                            "State only details visible in the image: product type, colors, "
                            "materials, graphics, text, fit, and notable features. Do not infer "
                            "a brand, occasion, audience, or claims not shown."
                        ),
                    },
                ],
            }
        ],
        max_tokens=300,
        temperature=0,
    )
    description = completion.choices[0].message.content or ""
    if not description.strip():
        raise ValueError("The vision model returned an empty description.")
    return description.strip()


def marketing_prompt(caption: str, platform: str, tone: str, language: str) -> str:
    return (
        "You are Sparkle AI, an expert product marketing copywriter. "
        f"Write in {language}. The vision analysis of the product image is: {caption}. "
        "Treat that analysis as the source of truth for all product facts. Do not invent or "
        "exaggerate colors, materials, fit, graphics, text, use cases, audience, brand, or claims. "
        "Keep the description factual and product-specific, using only visually verified details. "
        f"Create content for {platform} in a {tone} tone. Return only valid JSON with keys "
        '"title", "description", "caption", "cta", and "hashtags". '
        "hashtags must be an array of 5 to 10 strings."
    )


def generate_copy(prompt: str, token: str, model: str) -> str:
    client = InferenceClient(provider="auto", api_key=token)
    completion = client.chat_completion(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.7,
    )
    return completion.choices[0].message.content or ""


async def generate_marketing_content(
    content: bytes, content_type: str, platform: str, tone: str, language: str, settings: Settings
) -> dict:
    if not settings.hf_token:
        raise HTTPException(
            status_code=503,
            detail="HF_TOKEN is required to generate marketing content.",
        )
    try:
        detected = await asyncio.wait_for(
            run_in_threadpool(
                describe_image,
                content,
                content_type,
                settings.hf_token,
                settings.hf_vision_model,
            ),
            timeout=90,
        )
    except TimeoutError as exc:
        raise HTTPException(status_code=503, detail="The vision model timed out. Please try again.") from exc
    prompt = marketing_prompt(detected, platform, tone, language)
    try:
        raw = await asyncio.wait_for(
            run_in_threadpool(generate_copy, prompt, settings.hf_token, settings.hf_text_model),
            timeout=90,
        )
    except TimeoutError as exc:
        raise HTTPException(status_code=503, detail="The AI provider timed out. Please try again.") from exc
    except (HfHubHTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Hugging Face inference is not enabled for this token. Enable an Inference Provider for the configured model, then try again.",
        ) from exc
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise HTTPException(status_code=502, detail="The AI provider returned an invalid response.")
    try:
        result = json.loads(match.group())
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="The AI provider returned invalid JSON.") from exc
    result["detected_caption"] = detected
    return result
