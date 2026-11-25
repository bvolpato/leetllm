import { describe, expect, test } from "vitest"
import { buildCodeFoldPlan, parseFocusRanges } from "./code-folding"

describe("code-folding", () => {
    test("parses single lines and hyphen ranges for focus metadata", () => {
        expect([...parseFocusRanges("3, 6-8, 12-13", 20)]).toEqual([3, 6, 7, 8, 12, 13])
        expect([...parseFocusRanges("0-2, 99", 5)]).toEqual([1, 2])
    })

    test("extracts explicit # fold:start / # fold:end blocks while keeping clean runnable code", () => {
        const source = [
            "# fold:start imports & fixtures",
            "import math",
            "import torch",
            "x = torch.tensor([1.0, 2.0])",
            "# fold:end",
            "def softmax(logits):",
            "    shifted = logits - logits.max()",
            "    exps = shifted.exp()",
            "    return exps / exps.sum()",
            "# fold:start demo harness",
            "print(softmax(x))",
            "assert True",
            "# fold:end",
        ].join("\n")

        const plan = buildCodeFoldPlan(source, { language: "python" })

        expect(plan.hasFolds).toBe(true)
        expect(plan.cleanCode).not.toContain("fold:start")
        expect(plan.cleanCode).not.toContain("fold:end")
        expect(plan.totalLines).toBe(9)
        expect(plan.hiddenLineCount).toBe(5)
        expect(plan.segments.map((s) => s.kind)).toEqual(["folded", "visible", "folded"])
        expect(plan.segments[0]).toMatchObject({
            kind: "folded",
            label: "imports & fixtures",
            startLine: 1,
            endLine: 3,
            edge: "top",
        })
        expect(plan.segments[1]).toMatchObject({
            kind: "visible",
            startLine: 4,
            endLine: 7,
        })
        expect(plan.segments[2]).toMatchObject({
            kind: "folded",
            label: "demo harness",
            startLine: 8,
            endLine: 9,
            edge: "bottom",
        })
    })

    test("builds GitHub-diff-style folded edges around explicit focus ranges", () => {
        const lines = Array.from({ length: 14 }, (_, i) => `line_${i + 1} = ${i + 1}`)
        const plan = buildCodeFoldPlan(lines.join("\n"), {
            language: "python",
            focus: "5-7,10-11",
        })

        expect(plan.hasFolds).toBe(true)
        expect(plan.hasFocusHighlights).toBe(true)
        expect(plan.segments.map((s) => `${s.kind}:${s.startLine}-${s.endLine}`)).toEqual([
            "folded:1-4",
            "visible:5-7",
            "folded:8-9",
            "visible:10-11",
            "folded:12-14",
        ])
    })

    test("automatically folds leading Python imports and trailing print/assert harness on long blocks", () => {
        const source = [
            "import math",
            "import numpy as np",
            "import torch",
            "torch.manual_seed(0)",
            "",
            "def scaled_attention(q, k, v):",
            "    d_k = q.shape[-1]",
            "    scores = (q @ k.T) / math.sqrt(d_k)",
            "    weights = torch.softmax(scores, dim=-1)",
            "    return weights @ v",
            "",
            "q = torch.randn(4, 8)",
            "k = torch.randn(4, 8)",
            "v = torch.randn(4, 8)",
            "out = scaled_attention(q, k, v)",
            "assert out.shape == (4, 8)",
            "assert torch.isfinite(out).all()",
            "print('shape:', out.shape)",
            "print('mean:', float(out.mean()))",
        ].join("\n")

        const plan = buildCodeFoldPlan(source, { language: "python" })

        expect(plan.hasFolds).toBe(true)
        expect(plan.segments[0]).toMatchObject({
            kind: "folded",
            label: "imports & setup",
            edge: "top",
        })
        expect(plan.segments.at(-1)).toMatchObject({
            kind: "folded",
            label: "example run & checks",
            edge: "bottom",
        })
        const visibleLines = plan.segments
            .filter((s) => s.kind === "visible")
            .flatMap((s) => s.lines)
            .join("\n")
        expect(visibleLines).toContain("def scaled_attention")
    })

    test("respects noFold and output flags without folding", () => {
        const source = Array.from({ length: 25 }, (_, i) => `import mod_${i}`).join("\n")
        expect(buildCodeFoldPlan(source, { language: "python", noFold: true }).hasFolds).toBe(false)
        expect(buildCodeFoldPlan(source, { language: "python", output: true }).hasFolds).toBe(false)
    })

    test("automatically folds repeated leading Python imports shown earlier in the same lesson while keeping cleanCode runnable", () => {
        const source = [
            "import numpy as np",
            "import json",
            "",
            "x = np.array([1.0, 2.0])",
            "print(json.dumps(x.tolist()))",
        ].join("\n")
        const plan = buildCodeFoldPlan(source, {
            language: "python",
            priorImports: ["import numpy as np", "import json"],
        })
        expect(plan.hasFolds).toBe(true)
        expect(plan.cleanCode).toContain("import numpy as np")
        expect(plan.segments[0]).toMatchObject({
            kind: "folded",
            label: "repeated imports",
            edge: "top",
        })
        expect(plan.segments[1]).toMatchObject({
            kind: "visible",
            lines: ["x = np.array([1.0, 2.0])", "print(json.dumps(x.tolist()))"],
        })
    })
})
