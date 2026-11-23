import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export interface ChapterIntroduction {
  framing?: string
  paragraphs: string[]
  outcomes?: string[]
  question?: string
}

const INTRODUCTIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "introductions")

/** Opening pages are authored book text, separate from the shared lesson body. */
export function parseChapterIntroduction(value: unknown, source: string): ChapterIntroduction {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${source}: expected a chapter introduction object`)
  }
  const fields = value as Record<string, unknown>
  const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0
  const texts = (value: unknown): value is string[] => Array.isArray(value) && value.every(text)
  const unexpected = Object.keys(fields).filter(key => !["framing", "paragraphs", "outcomes", "question"].includes(key))
  if (unexpected.length) throw new Error(`${source}: unknown introduction fields: ${unexpected.join(", ")}`)
  const { framing, paragraphs, outcomes, question } = fields
  if (!texts(paragraphs)) throw new Error(`${source}: paragraphs must be an array of nonempty text; use [] to begin with the chapter body`)
  if (framing !== undefined && !text(framing)) throw new Error(`${source}: framing must be nonempty text when present`)
  if (outcomes !== undefined && !texts(outcomes)) throw new Error(`${source}: outcomes must be an array of nonempty text when present`)
  if (question !== undefined && !text(question)) throw new Error(`${source}: question must be nonempty text when present`)
  return {
    ...(framing === undefined ? {} : { framing }),
    paragraphs,
    ...(outcomes === undefined ? {} : { outcomes }),
    ...(question === undefined ? {} : { question }),
  }
}

export function loadChapterIntroduction(slug: string, directory = INTRODUCTIONS_DIR): ChapterIntroduction {
  const path = join(directory, `${slug}.json`)
  if (!existsSync(path)) throw new Error(`Missing chapter introduction: ${path}`)
  let value: unknown
  try {
    value = JSON.parse(readFileSync(path, "utf8"))
  } catch (error) {
    throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
  return parseChapterIntroduction(value, path)
}
