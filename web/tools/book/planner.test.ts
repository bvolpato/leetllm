import { describe, expect, it } from "vitest"
import type { Question } from "../../src/lib/questions"
import type { BookConfig } from "./renderer"
import { planBook } from "./planner"

const questions = [
  { slug: "tokens", section: "Core LLM Foundations" },
  { slug: "eval", section: "Applied LLM Engineering" },
  { slug: "hidden", section: "Applied LLM Engineering", hidden: true },
] as Question[]

function config(parts: BookConfig["parts"], excludeSlugs: string[] = []): BookConfig {
  return { parts, excludeSections: [], excludeSlugs } as unknown as BookConfig
}

const part = { number: 1, title: "Models", description: "Learn models." }

describe("book selection", () => {
  it("preserves explicit editorial order with continuous chapter numbers across parts", () => {
    const plan = planBook(config([
      { ...part, chapterSlugs: ["eval"] },
      { ...part, number: 2, chapterSlugs: ["tokens"] },
    ]), questions)
    expect(plan.flatMap((entry) => entry.chapters.map(({ chapterNumber, question }) => [chapterNumber, question.slug])))
      .toEqual([[1, "eval"], [2, "tokens"]])
  })

  it("starts chapter numbers at 1 in a Part 0 and rejects negative part numbers", () => {
    const plan = planBook(config([
      { ...part, number: 0, chapterSlugs: ["eval"] },
      { ...part, chapterSlugs: ["tokens"] },
    ]), questions)
    expect(plan.map((entry) => [entry.partNumber, entry.chapters[0].chapterNumber])).toEqual([[0, 1], [1, 2]])
    expect(() => planBook(config([{ ...part, number: -1, chapterSlugs: ["eval"] }]), questions)).toThrow(/part number/)
  })

  it("filters excluded lessons from section editions", () => {
    const plan = planBook(config([{ ...part, sections: ["Core LLM Foundations", "Applied LLM Engineering"] }], ["tokens"]), questions)
    expect(plan[0].chapters.map(({ question }) => question.slug)).toEqual(["eval"])
  })

  it("rejects missing, duplicate, excluded, and ambiguous explicit selections", () => {
    for (const chapterSlugs of [["missing"], ["tokens", "tokens"], ["hidden"]]) {
      expect(() => planBook(config([{ ...part, chapterSlugs }]), questions)).toThrow()
    }
    expect(() => planBook(config([{ ...part, chapterSlugs: ["tokens"] }], ["tokens"]), questions)).toThrow(/excluded/)
    expect(() => planBook(config([{ ...part, chapterSlugs: ["tokens"], sections: ["Core LLM Foundations"] }]), questions)).toThrow(/either/)
    expect(() => planBook(config([{ ...part }]), questions)).toThrow(/either/)
  })
})
