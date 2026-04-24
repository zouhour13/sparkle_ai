import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

FILE = "f:/Sparkle_AI/sparkle-ai/description_generation.ipynb"
TARGET = {"ca3f1b2e", "9382fe53", "8f4a111f", "0710f57a"}

with open(FILE, "r", encoding="utf-8") as f:
    nb = json.load(f)

all_ok = True
for cell in nb["cells"]:
    if cell.get("cell_type") != "code" or cell.get("id") not in TARGET:
        continue
    cid = cell["id"]
    src = "".join(cell.get("source", []))

    checks = {
        "max_new_tokens=150":              "max_new_tokens=150" in src,
        "attention_mask present":          'attention_mask=inputs["attention_mask"]' in src,
        "set_num_threads present":         "set_num_threads" in src,
        "repetition_penalty removed":      "repetition_penalty" not in src,
        "pad_token_id indent OK":          "                pad_token_id" not in src,  # bad indent gone
    }

    # not every cell needs all checks — skip inapplicable ones
    if "tiny_model.generate" not in src:
        del checks["max_new_tokens=150"]
        del checks["attention_mask present"]
        del checks["repetition_penalty removed"]
        del checks["pad_token_id indent OK"]
    if "AutoModelForCausalLM" not in src:
        del checks["set_num_threads present"]

    print(f"\n[Cell {cid}]")
    for label, ok in checks.items():
        status = "OK" if ok else "FAIL"
        print(f"  [{status}] {label}")
        if not ok:
            all_ok = False

print("\n" + ("ALL CHECKS PASSED" if all_ok else "SOME CHECKS FAILED"))
