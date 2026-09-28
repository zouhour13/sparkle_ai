import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SocialPublisher from "./SocialPublisher";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("test-token") }),
}));

afterEach(() => vi.restoreAllMocks());

describe("SocialPublisher", () => {
  it("requires durable generated content before publishing", () => {
    render(
      <SocialPublisher
        content={{ caption: "A caption", hashtags: ["#sparkle"] }}
        imagePreview="blob:preview"
      />
    );

    expect(screen.getByText(/Regenerate this item/i)).toBeInTheDocument();
  });

  it("shows connected accounts in the composer", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      const body = url.includes("publish-history")
        ? []
        : [{ id: "account-1", provider: "instagram", provider_account_id: "ig-1", account_name: "Sparkle Shop", status: "connected" }];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    });

    render(
      <SocialPublisher
        content={{ record_id: "content-1", caption: "A caption", hashtags: ["#sparkle"] }}
        imagePreview="https://example.com/product.jpg"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Post to social media/i }));

    await waitFor(() => expect(screen.getByText("Sparkle Shop")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Publish to Instagram/i })).toBeEnabled();
  });
});
