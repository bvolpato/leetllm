import { describe, expect, it, vi } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as bookFigures from "../illustrations/book"
import type { Question } from "../../src/lib/questions"
import { chapterSections, cleanContentForBook, formatPageList, renderBibliography, renderChapter, renderPartDivider, renderTableOfContents } from "./renderer"

function chapter(content: string): Question {
  return {
    slug: "print-fixture", title: "Attention & routing", content,
    shortDescription: "A small print fixture.", references: {},
  } as Question
}

function documentFor(content: string): Document {
  return new DOMParser().parseFromString(renderChapter(chapter(content), 7), "text/html")
}

describe("book rendering", () => {
  it("links a part opening to its numbered chapters and preserves authored paragraphs", () => {
    const html = renderPartDivider(3, "Training & adaptation", ["A reason to experiment.", "A question worth pursuing: <what changes?>"], [
      { chapterNumber: 19, title: "Data & judgment", slug: "data" },
      { chapterNumber: 20, title: "Learning from feedback", slug: "feedback" },
    ])
    const doc = new DOMParser().parseFromString(html, "text/html")
    expect([...doc.querySelectorAll(".part-description p")].map(p => p.textContent)).toEqual(["A reason to experiment.", "A question worth pursuing: <what changes?>"])
    expect([...doc.querySelectorAll(".part-chapter-map a")].map(a => [a.getAttribute("href"), a.textContent])).toEqual([
      ["https://leetllm.com/learn/data", "19Data & judgment"],
      ["https://leetllm.com/learn/feedback", "20Learning from feedback"],
    ])
    const reference = new DOMParser().parseFromString(renderPartDivider(1, "Reference", "A short overview."), "text/html")
    expect(reference.querySelector(".part-description p")?.textContent).toBe("A short overview.")
    expect(reference.querySelector(".part-chapter-map")).toBeNull()
  })

  it("opens with authored orientation while preserving the complete technical body", () => {
    const html = renderChapter(chapter("The mechanism starts here.\n\n```checkpoint\nWhat changes?\n---\nThe live state.\n```"), 7, {
      introduction: {
        framing: "Weight fit & live state",
        paragraphs: ["The motivating problem.", "Why this matters.", "The worked route.", "Where this fits."],
        outcomes: ["Calculate storage.", "Trace allocation.", "Compare <results>."],
        question: "What happens when requests overlap?",
      },
    })
    const doc = new DOMParser().parseFromString(html, "text/html")
    expect(doc.querySelector(".chapter-opening h1")?.textContent).toBe("Attention & routing")
    expect(doc.querySelectorAll(".chapter-introduction > p")).toHaveLength(4)
    expect(doc.querySelectorAll(".introduction-outcomes li")).toHaveLength(3)
    expect(doc.querySelector(".introduction-outcomes li:last-child")?.textContent).toBe("Compare <results>.")
    expect(doc.querySelector(".introduction-question p")?.textContent).toBe("What happens when requests overlap?")
    expect(doc.querySelector(".chapter-opening + .chapter-content")?.textContent).toContain("The mechanism starts here.")
    expect(doc.querySelector(".checkpoint-answer-row")?.textContent).toContain("The live state.")
    expect(doc.querySelector(".chapter-summary")).toBeNull()
  })

  it("renders a short introduction without inventing learning-goal or question sections", () => {
    const html = renderChapter(chapter("The mechanism starts here."), 7, {
      introduction: { paragraphs: ["Follow <one token> through the cache."] },
    })
    const doc = new DOMParser().parseFromString(html, "text/html")
    expect(doc.querySelector(".chapter-introduction")?.textContent?.trim()).toBe("Follow <one token> through the cache.")
    expect(doc.querySelector(".introduction-framing, .introduction-outcomes, .introduction-question")).toBeNull()
    expect(doc.querySelector(".chapter-opening + .chapter-content")?.textContent).toBe("The mechanism starts here.")
  })

  it("lets the chapter body open directly when no separate orientation is needed", () => {
    const html = renderChapter(chapter("The worked example starts here."), 7, {
      introduction: { paragraphs: [] },
    })
    const doc = new DOMParser().parseFromString(html, "text/html")
    expect(doc.querySelector(".chapter-header + .chapter-content")?.textContent).toBe("The worked example starts here.")
    expect(doc.querySelector(".chapter-opening, .chapter-introduction, .chapter-summary")).toBeNull()
  })

  it("keeps an authored caption once, with a single numbered figure", () => {
    const doc = documentFor('<figure><img src="data:image/png;base64,AA==" alt="Accessible description"/><figcaption>The authored teaching caption.</figcaption></figure>')
    expect(doc.querySelectorAll("figure")).toHaveLength(1)
    expect(doc.querySelectorAll("figcaption")).toHaveLength(1)
    expect(doc.querySelector("figcaption")?.textContent).toBe("Figure 7.1. The authored teaching caption.")
  })

  it("lets a reviewed complete caption replace extracted notes while preserving default qualifiers", () => {
    const asset = vi.spyOn(bookFigures, "resolveBookIllustration").mockReturnValue({
      path: join(process.cwd(), "public/icon-192.png"),
      notes: ["The measured interval excludes queueing."],
    })
    try {
      const image = '<img src="/cdn/content-image/fundamentals/print-fixture/illustrations/_generated/chart_light.png" alt="Chart"/>'
      const complete = documentFor(`<figure data-book-caption="complete">${image}<figcaption>The interval covers execution after admission.</figcaption></figure>`)
      expect(complete.querySelector("figcaption")?.textContent).toBe("Figure 7.1. The interval covers execution after admission.")
      const automatic = documentFor(`<figure>${image}<figcaption>An execution interval.</figcaption></figure>`)
      expect(automatic.querySelector("figcaption")?.textContent).toContain("The measured interval excludes queueing.")
    } finally {
      asset.mockRestore()
    }
  })

  it.each(["illustrations/", "./illustrations/"])("embeds book-only print images from an article-relative %s source", (prefix) => {
    const printedImage = join(process.cwd(), "public/icon-192.png")
    const asset = vi.spyOn(bookFigures, "resolveBookIllustration").mockReturnValue({
      path: printedImage,
      notes: ["Only authorized evidence enters the parent section."],
    })
    try {
      const content = `<figure><img src="${prefix}_generated/book-only-fixture_dark.png" alt="Parent evidence"/><figcaption>The parent retains the rule.</figcaption></figure>`
      const q = { ...chapter(content), slug: "chunking-strategies-document-processing" }
      const doc = new DOMParser().parseFromString(renderChapter(q, 7), "text/html")
      const src = doc.querySelector("img")?.getAttribute("src") ?? ""
      expect(src.startsWith("data:image/png;base64,")).toBe(true)
      const actual = createHash("sha256").update(Buffer.from(src.split(",")[1], "base64")).digest("hex")
      const expected = createHash("sha256").update(readFileSync(printedImage)).digest("hex")
      expect(actual).toBe(expected)
      expect(doc.querySelector("figcaption")?.textContent).toContain("Only authorized evidence enters the parent section.")
      expect(asset).toHaveBeenCalledWith("retrieval/chunking-strategies-document-processing/illustrations/_generated/book-only-fixture_dark.png")
    } finally {
      asset.mockRestore()
    }
  })

  it("preserves literal angle-bracket tokens while rendering caption math", () => {
    const doc = documentFor('<figure><img src="data:image/png;base64,AA==" alt="Byte fallback can avoid &lt;UNK&gt;. Compare $p &lt; q$."/></figure>')
    expect(doc.querySelector("figcaption")?.textContent).toContain("Byte fallback can avoid <UNK>.")
    expect(doc.querySelector("figcaption .katex")).not.toBeNull()
  })

  it("preserves measured diagram sizing through the final image renderer", () => {
    const doc = documentFor('<figure><img src="data:image/png;base64,AA==" alt="Request flow" style="width:240pt;max-width:100%"/></figure>')
    expect(doc.querySelector("img")?.style.width).toBe("240pt")
    expect(doc.querySelector("img")?.style.maxWidth).toBe("100%")
  })

  it("keeps short prose intact while leaving long paragraphs available for pagination", () => {
    const short = 'Keep the <code>grammar</code> example and its last word together.'
    const long = "A detailed explanation with another observation. ".repeat(16).trim()
    const doc = documentFor(`<p>${short}</p><p>${long}</p>`)
    const paragraphs = doc.querySelectorAll(".chapter-content > p")
    expect(paragraphs[0].classList.contains("book-prose-keep")).toBe(true)
    expect(paragraphs[0].textContent).toBe("Keep the grammar example and its last word together.")
    expect(paragraphs[1].classList.contains("book-prose-keep")).toBe(false)
    expect(paragraphs[1].textContent).toBe(long)
  })

  it("keeps Python block headers and multiline signatures with the following code", () => {
    const source = [
      ...Array.from({ length: 12 }, (_, index) => `print(${index})`),
      "class CircuitOpen(Exception):", "    pass", "",
      "def recover(", "    request,", "):", "    return request",
      ...Array.from({ length: 8 }, (_, index) => `print(${index})`),
    ].join("\n")
    const doc = documentFor(`\`\`\`python\n${source}\n\`\`\``)
    const lines = [...doc.querySelectorAll<HTMLElement>("pre > code > span")]
    for (const expected of ["class CircuitOpen(Exception):", "def recover(", "    request,", "):"]) {
      expect(lines.find(line => line.textContent?.includes(expected))?.style.breakAfter).toBe("avoid-page")
    }
    expect(doc.querySelector(".code-listing-long")).not.toBeNull()
    const compact = documentFor(`\`\`\`python\n${Array.from({ length: 9 }, () => "print('row')").join("\n")}\n\`\`\``)
    expect(compact.querySelector(".code-listing-long")).toBeNull()
  })

  it("preserves substantive next steps and navigation-like code examples", () => {
    const source = '## Next steps\n\nMeasure queue delay before changing concurrency.\n\n```markdown\n> **Next:** Continue to [Example](/learn/example).\n```\n\n> **Next:** Continue to [Actual next lesson](/learn/next).'
    const doc = documentFor(source)
    expect(doc.body.textContent).toContain("Measure queue delay")
    expect(doc.querySelector("pre")?.textContent).toContain("Continue to [Example]")
    expect(doc.body.textContent).not.toContain("Actual next lesson")
  })

  it("prints checkpoint answers completely when the answer contains a rule", () => {
    const doc = documentFor('```checkpoint\nWhich route is safe?\n---\nChoose the allowed route.\n\n---\n\nThen verify the result.\n```')
    expect(doc.querySelectorAll(".book-checkpoint")).toHaveLength(1)
    expect(doc.querySelector(".checkpoint-answer-row")?.textContent).toContain("Then verify the result.")
    expect(doc.querySelector(".checkpoint-question-row")?.textContent).toContain("Which route is safe?")
  })

  it("rejects malformed checkpoint content instead of printing an empty answer", () => {
    expect(() => documentFor('```checkpoint\nA question with no separator\n```')).toThrow(/checkpoint/i)
  })

  it("keeps legacy plain-text results unnumbered even without an output flag", () => {
    const doc = documentFor('```text title="Bradley-Terry output"\nP(A preferred over B) = 75.0%\nNLL = 0.287\n```\n\n```python\nprint("result")\n```')
    expect(doc.querySelector(".code-output .code-header")?.textContent).toBe("Bradley-Terry output")
    expect(doc.querySelectorAll(".code-output .linenumber")).toHaveLength(0)
    expect(doc.querySelectorAll(".code-listing:not(.code-output) .linenumber")).toHaveLength(1)
  })

  it("drops the reader prefix from listing titles and keeps a file name's case", () => {
    const doc = documentFor('```python title="reader-lora-budget.py"\nprint(1)\n```\n\n```text title="Reader LoRA budget"\n1\n```')
    const headers = [...doc.querySelectorAll(".code-header")].map((header) => header.textContent)
    expect(headers).toEqual(["lora-budget.py", "LoRA budget"])
  })

  it("prints the sources behind citations and scopes their destinations to the chapter", () => {
    const q = chapter('A claim.<sup><a href="https://example.org/paper" data-reference-key="paper" data-reference-number="1">[1]</a></sup>')
    q.references = { paper: { title: "A useful paper", authors: "A. Author", year: 2025, type: "paper", url: "https://example.org/paper" } }
    const doc = new DOMParser().parseFromString(renderChapter(q, 7), "text/html")
    const citation = doc.querySelector("sup a")
    expect(citation?.getAttribute("href")).toBe("#ref-print-fixture-1")
    const item = doc.getElementById("ref-print-fixture-1")
    expect(item?.textContent).toContain("A useful paper")
    expect(item?.querySelector("a")?.getAttribute("href")).toBe("https://example.org/paper")
  })

  it("removes quiz-only headings while retaining the next substantive section", () => {
    const doc = documentFor('## Check your understanding\n\n```mastery-quiz\n{"questions": []}\n```\n\n## Operational notes\n\nKeep the release evidence.')
    expect(doc.body.textContent).not.toContain("Check your understanding")
    expect(doc.body.textContent).toContain("Keep the release evidence")
    expect(cleanContentForBook('```text\n## Next Steps\nKeep this literal example.\n```')).toContain("Keep this literal example")
  })

  it("preserves parent headings and renders math inside authored HTML captions", () => {
    const doc = documentFor('## Attention\n\n### Scores\n\nCompute the scores.\n\n<figure><img src="data:image/png;base64,AA==" alt="Scores"/><figcaption>Scale by $\\sqrt{d_k}$.</figcaption></figure>')
    expect(doc.querySelector("h2")?.textContent).toBe("Attention")
    expect(doc.querySelector("figcaption .katex")).not.toBeNull()
    expect(doc.querySelector("figcaption")?.textContent).not.toContain("$")
  })

  it("keeps checkpoint exercises inside mastery markers while removing browser quiz data", () => {
    const doc = documentFor('<!-- leetllm: mastery:start -->\n## Try to fool the checker\n\nPredict which input crosses the trust boundary.\n\n```checkpoint\nWho checks the result?\n---\nThe trusted validator.\n```\n\n```mastery-quiz\n{"questions": ["BROWSER_ONLY"]}\n```\n<!-- leetllm: mastery:end -->')
    expect(doc.querySelector("h2")?.textContent).toBe("Try to fool the checker")
    expect(doc.body.textContent).toContain("Predict which input")
    expect(doc.querySelector(".checkpoint-answer-row")?.textContent).toContain("The trusted validator")
    expect(doc.body.textContent).not.toContain("BROWSER_ONLY")
  })

  it("keeps working companion URLs and identifies selected chapters for the merger", () => {
    const q = chapter('[Earlier mechanism](/learn/mechanism) and [Foundation](/learn/foundation). [Complete online implementation](/learn/mechanism?view=online).')
    const html = renderChapter(q, 7, { chapterNumbers: new Map([["mechanism", 3]]) })
    const doc = new DOMParser().parseFromString(html, "text/html")
    expect(doc.querySelector('a[href="https://leetllm.com/learn/mechanism"]')?.textContent).toBe("Earlier mechanism (Chapter 3)")
    expect(doc.querySelector('a[href="https://leetllm.com/learn/foundation"]')?.textContent).toBe("Foundation")
    expect(doc.querySelector('a[href="https://leetllm.com/learn/mechanism?view=online"]')?.textContent).toBe("Complete online implementation")
  })

  it("refuses to publish unrendered diagram source as a code listing", () => {
    expect(() => documentFor('```mermaid\ngraph LR\nA --> B\n```')).toThrow(/Unrendered Mermaid diagram/)
  })

  it("preserves word spacing around inline caption formatting", () => {
    const doc = documentFor('<figure><img src="data:image/png;base64,AA==" alt="Scores"/><figcaption>Inspect the <em>routing weights</em> before mixing values.</figcaption></figure>')
    expect(doc.querySelector("figcaption")?.textContent).toContain("Inspect the routing weights before mixing values.")
  })

  it("prints escaped currency as prose without changing literal code examples", () => {
    const source = 'The ceiling is $\\\\$0.30$.\n\n```text\n$\\\\$0.30$\n```'
    const doc = documentFor(source)
    expect(doc.querySelector(".chapter-content p")?.textContent).toBe("The ceiling is $0.30.")
    expect(doc.querySelector(".katex-error")).toBeNull()
    expect(doc.querySelector("pre")?.textContent).toContain('$\\\\$0.30$')
  })

  it("keeps indented HTML captions as prose rather than numbered code", () => {
    const doc = documentFor('<figure>\n  <img src="data:image/png;base64,AA==" alt="Loss masks"/>\n  <figcaption>\n    These are toy token IDs.\n    Prompt context remains in the graph.\n  </figcaption>\n</figure>')
    expect(doc.querySelector("figcaption")?.textContent).toContain("These are toy token IDs.")
    expect(doc.querySelector("figcaption .code-listing")).toBeNull()
  })

  it("gives tablet readers a clickable contents destination for each chapter", () => {
    const doc = new DOMParser().parseFromString(renderTableOfContents([{ partNumber: 1, title: "Models", chapters: [{ chapterNumber: 3, title: "Attention & routing", slug: "attention", section: "Models", pageNumber: 42 }] }]), "text/html")
    expect(doc.querySelector('a[href="https://leetllm.com/learn/attention"]')?.textContent).toBe("Attention & routing")
    expect(doc.querySelector(".toc-page-num")?.textContent).toBe("")
    expect(doc.querySelector(".toc-chapter-entry .toc-page-num")?.textContent).toBe("42")
  })

  it("collapses consecutive index pages into ranges", () => {
    expect(formatPageList([12, 3, 4, 5, 12, 40])).toBe("3-5, 12, 40")
    expect(formatPageList([3, 4, 5, 6], [4])).toBe("3, <strong>4</strong>, 5-6")
  })

  it("lists a source once in the bibliography, whichever chapter cited it", () => {
    const cited = { authors: "Vaswani et al.", year: 2017, title: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }
    const html = renderBibliography([{ ...cited, authors: "Vaswani, A." }, { ...cited, title: "attention is all you need." }, { authors: "Aho", year: 1975, title: "Efficient string matching", url: "https://example.org" }])
    const doc = new DOMParser().parseFromString(html, "text/html")
    expect(doc.querySelectorAll("li")).toHaveLength(2)
    expect(doc.querySelector("li")?.textContent).toContain("Aho")
  })

  it("names running-head sections from headings without their markup, entities, or raw KaTeX annotations", () => {
    expect(chapterSections('<h2 id="a">Cost &amp; <em>latency</em></h2><h3 id="b">Skipped</h3><h2 id="c"></h2>')).toEqual([{ id: "a", title: "Cost & latency" }])
    const mathHeading = '<h2 id="scale">Why scale by <span class="katex"><span class="katex-mathml"><math><semantics><annotation encoding="application/x-tex">\\sqrt{d_k}</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span>dk\u200b</span></span></span>?</h2>'
    expect(chapterSections(mathHeading)).toEqual([{ id: "scale", title: "Why scale by √d_k?" }])
  })

  it("collapses web code-folding scaffolding blocks, strips repeated chapter imports, and omits trivial outputs", () => {
    const first = [
      "import math",
      "print(math.sqrt(4))",
    ].join("\n")
    const second = [
      "# fold:start Setup helpers",
      "HELPER_CONST = 9",
      "# fold:end",
      "import math",
      "print(math.sqrt(HELPER_CONST))",
      "# fold:start print & assert harness",
      "assert True",
      "# fold:end",
    ].join("\n")
    const third = [
      "import math",
      "x = math.sqrt(16)",
    ].join("\n")
    const doc = documentFor([
      `\`\`\`python\n${first}\n\`\`\``,
      `\`\`\`text output\nAll checks passed.\n\`\`\``,
      `\`\`\`python\n${second}\n\`\`\``,
      `\`\`\`python\n${third}\n\`\`\``,
    ].join("\n\n"))
    const listings = [...doc.querySelectorAll("pre")].map((pre) => pre.textContent ?? "")
    expect(listings).toHaveLength(3)
    expect(listings[0]).toContain("import math")
    expect(listings[1]).toContain("# ... Setup helpers")
    expect(listings[1]).not.toContain("HELPER_CONST = 9")
    expect(listings[1]).not.toContain("assert True")
    expect(listings[1]).not.toContain("print & assert harness")
    expect(listings[2]).not.toContain("import math")
    expect(listings[2]).toContain("x = math.sqrt(16)")
    expect(doc.querySelector(".code-output")).toBeNull()
  })
})
