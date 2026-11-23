import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { loadChapterIntroduction, parseChapterIntroduction } from "./introductions"

const introduction = {
  framing: "The state that survives a token",
  paragraphs: ["A request needs memory.", "Weight fit is only a starting point.", "Follow the live state.", "Use the model's request lifecycle."],
  outcomes: ["Calculate storage.", "Trace allocation.", "Compare outputs."],
  question: "What changes when one request becomes many?",
}

describe("authored chapter introductions", () => {
  it("loads the complete opening page and rejects missing or malformed authoring inputs", () => {
    const directory = mkdtempSync(join(tmpdir(), "book-introduction-"))
    try {
      writeFileSync(join(directory, "cache.json"), JSON.stringify(introduction))
      expect(loadChapterIntroduction("cache", directory)).toEqual(introduction)
      expect(() => loadChapterIntroduction("missing", directory)).toThrow(/Missing chapter introduction/)
      writeFileSync(join(directory, "cache.json"), "{")
      expect(() => loadChapterIntroduction("cache", directory)).toThrow(/cache\.json/)
    } finally {
      rmSync(directory, { recursive: true })
    }
  })

  it("accepts concise openings and an explicit choice to begin with the chapter body", () => {
    const concise = { paragraphs: ["Follow one token through the cache."] }
    expect(parseChapterIntroduction(concise, "cache.json")).toEqual(concise)
    expect(parseChapterIntroduction({ paragraphs: [] }, "cache.json")).toEqual({ paragraphs: [] })
    const focused = { ...concise, outcomes: ["Trace allocation."] }
    expect(parseChapterIntroduction(focused, "cache.json")).toEqual(focused)
  })

  it("rejects malformed authored text while allowing optional teaching components", () => {
    expect(() => parseChapterIntroduction({ ...introduction, question: " " }, "cache.json")).toThrow(/cache\.json/)
    expect(() => parseChapterIntroduction({}, "cache.json")).toThrow(/paragraphs/)
    expect(() => parseChapterIntroduction({ paragraphs: [" "] }, "cache.json")).toThrow(/paragraphs/)
    expect(() => parseChapterIntroduction({ ...introduction, framing: "" }, "cache.json")).toThrow(/framing/)
    expect(() => parseChapterIntroduction({ ...introduction, outcomes: [false] }, "cache.json")).toThrow(/outcomes/)
    expect(() => parseChapterIntroduction({ ...introduction, typo: "unused" }, "cache.json")).toThrow(/unknown introduction fields: typo/)
  })
})
