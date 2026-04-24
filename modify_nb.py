import sys, io, json, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

FILE = "f:/Sparkle_AI/sparkle-ai/description_generation.ipynb"

with open(FILE, "r", encoding="utf-8") as f:
    nb = json.load(f)

changes = []

# ---------------------------------------------------------------------------
# Helper: rebuild a cell's source list from a plain string
# ---------------------------------------------------------------------------
def set_source(cell, text):
    lines = text.split("\n")
    cell["source"] = [l + "\n" for l in lines]
    cell["source"][-1] = cell["source"][-1].rstrip("\n")


# ---------------------------------------------------------------------------
# Helper: apply a single string replacement and log it
# ---------------------------------------------------------------------------
def apply(src, old, new, label):
    if old in src:
        changes.append(label)
        return src.replace(old, new)
    return src


# ---------------------------------------------------------------------------
# Patch every code cell
# ---------------------------------------------------------------------------
for cell in nb.get("cells", []):
    if cell.get("cell_type") != "code":
        continue

    cid  = cell.get("id", "?")
    src  = "".join(cell.get("source", []))
    orig = src

    # ── 1. Model-loading cell: add CPU thread setup if missing ────────────────
    if "AutoModelForCausalLM" in src and "set_num_threads" not in src:
        src = apply(
            src,
            'tiny_model.eval()\n\nprint("✅ TinyLlama ready!")',
            (
                'tiny_model.eval()\n\n'
                '# -- CPU Performance Optimisations --\n'
                'import os as _os\n'
                '_n_threads = _os.cpu_count() or 4\n'
                'torch.set_num_threads(_n_threads)\n'
                'torch.set_num_interop_threads(max(1, _n_threads // 2))\n'
                'print(f"[CPU] {_n_threads} intra-op threads, '
                '{max(1, _n_threads // 2)} inter-op threads")\n\n'
                'print("TinyLlama ready!")'
            ),
            f"[{cid}] Added CPU thread optimisation",
        )

    # ── 2. max_new_tokens 300 → 150 ───────────────────────────────────────────
    src = apply(src, "max_new_tokens=300", "max_new_tokens=150",
                f"[{cid}] max_new_tokens 300 -> 150")

    # ── 3. Remove repetition_penalty ─────────────────────────────────────────
    for indent in ("        ", "    "):
        old_rp = f"{indent}repetition_penalty=1.1,\n"
        if old_rp in src:
            changes.append(f"[{cid}] Removed repetition_penalty")
            src = src.replace(old_rp, "")

    # ── 4. Fix broken over-indented pad_token_id (from a previous partial patch)
    src = apply(
        src,
        "                pad_token_id=tiny_tokenizer.eos_token_id,",
        "            pad_token_id=tiny_tokenizer.eos_token_id,",
        f"[{cid}] Fixed pad_token_id indentation",
    )

    # ── 5. Add attention_mask to generate() calls that are missing it ─────────
    # Pattern: input_ids arg followed immediately by max_new_tokens (no attention_mask)
    OLD_GEN_8 = (
        '            inputs["input_ids"],\n'
        '            max_new_tokens='
    )
    NEW_GEN_8 = (
        '            inputs["input_ids"],\n'
        '            attention_mask=inputs["attention_mask"],\n'
        '            max_new_tokens='
    )
    OLD_GEN_4 = (
        '        inputs["input_ids"],\n'
        '        max_new_tokens='
    )
    NEW_GEN_4 = (
        '        inputs["input_ids"],\n'
        '        attention_mask=inputs["attention_mask"],\n'
        '        max_new_tokens='
    )
    if 'attention_mask=inputs["attention_mask"]' not in src:
        if OLD_GEN_8 in src:
            src = apply(src, OLD_GEN_8, NEW_GEN_8,
                        f"[{cid}] Added attention_mask (8-space indent)")
        elif OLD_GEN_4 in src:
            src = apply(src, OLD_GEN_4, NEW_GEN_4,
                        f"[{cid}] Added attention_mask (4-space indent)")

    if src != orig:
        set_source(cell, src)

# ---------------------------------------------------------------------------
with open(FILE, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print(f"\nNotebook updated - {len(changes)} change(s):")
for c in changes:
    print(f"  - {c}")
if not changes:
    print("  (nothing to patch - already up to date)")
