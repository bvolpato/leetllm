import type { Question } from "../../src/lib/questions"
import type { BookConfig } from "./renderer"
import { isVisibleToAudience } from "../../src/lib/content-audience"

export interface PlannedPart {
  partNumber: number
  title: string
  description: string | string[]
  chapters: Array<{ chapterNumber: number; question: Question }>
}

/** Resolve either a section reference edition or an explicitly ordered reading edition. */
export function planBook(config: BookConfig, questions: Question[]): PlannedPart[] {
  const bySlug = new Map(questions.map((question) => [question.slug, question]))
  const knownSections = new Set(questions.map((question) => question.section as string))
  const usedSections = new Set<string>()
  const usedNumbers = new Set<number>()
  const usedSlugs = new Set<string>()
  const planned: PlannedPart[] = []
  let chapterNumber = 1
  const isExcluded = (question: Question): boolean => {
    const metadata = question as unknown as Record<string, unknown>
    return config.excludeSections.includes(question.section) || config.excludeSlugs.includes(question.slug) || !isVisibleToAudience(metadata, "book")
  }
  for (const part of config.parts) {
    if (!Number.isInteger(part.number) || part.number < 0 || usedNumbers.has(part.number)) {
      throw new Error(`Invalid or duplicate book part number: ${part.number}`)
    }
    usedNumbers.add(part.number)
    if (!!part.sections?.length === !!part.chapterSlugs?.length) {
      throw new Error(`Part ${part.number} must select either sections or chapterSlugs.`)
    }
    const selected: Question[] = []
    if (part.chapterSlugs?.length) {
      for (const slug of part.chapterSlugs) {
        const question = bySlug.get(slug)
        if (!question) throw new Error(`Unknown book chapter: ${slug}`)
        if (isExcluded(question)) throw new Error(`Explicit book chapter is excluded: ${slug}`)
        selected.push(question)
      }
    } else {
      for (const section of part.sections!) {
        if (!knownSections.has(section)) throw new Error(`Unknown book section: ${section}`)
        if (usedSections.has(section)) throw new Error(`Book section assigned more than once: ${section}`)
        usedSections.add(section)
        selected.push(...questions.filter((question) => question.section === section && !isExcluded(question)))
      }
    }
    const chapters = selected.map((question) => {
      if (usedSlugs.has(question.slug)) throw new Error(`Duplicate book chapter: ${question.slug}`)
      usedSlugs.add(question.slug)
      return { chapterNumber: chapterNumber++, question }
    })
    if (chapters.length) planned.push({ partNumber: part.number, title: part.title, description: part.description, chapters })
  }
  if (!planned.length) throw new Error("The selected preset contains no chapters.")
  return planned
}
