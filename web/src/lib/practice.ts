import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { loadContentBundle, type ContentBundleMetadata } from "./content-bundle"
import { normalizePracticeGuideText } from "./practice-guide-format"
import { JAVA_PRACTICE_BUNDLES } from "./practice-java-bundles"
import { PRACTICE_LANGUAGES, type PracticeLanguage } from "./practice-languages"

export type PracticeDifficulty = "Easy" | "Medium" | "Hard"
export type PracticeTestVisibility = "sample" | "hidden"
export type PracticeCaseVisibility = PracticeTestVisibility | "custom"
export type PracticeCheckOperator = "==" | "!=" | "<" | "<=" | ">" | ">=" | "is" | "is not" | "in" | "not in"

export interface PracticeTestCheck {
    input: string
    expression: string
    expected: string
    operator: PracticeCheckOperator
    before?: string
    feedback?: string
}

export interface PracticeTestCase {
    name: string
    visibility: PracticeCaseVisibility
    code?: string
    setup?: string
    checks?: PracticeTestCheck[]
    description?: string
    input?: string
    expected?: string
    feedback?: string
}

export interface PracticeProblemLanguageBundle {
    starterCode: string
    testCases: PracticeTestCase[]
    solutionGuide: string
}

export interface PracticeProblem {
    id: string
    slug: string
    title: string
    difficulty: PracticeDifficulty
    category: string
    language: PracticeLanguage
    timeEstimateMinutes: number
    timeLimitMs: number
    memoryLimitMb: number
    order: number
    tags: string[]
    source: string
    summary: string
    starterCode: string
    testCases: PracticeTestCase[]
    languages: Partial<Record<PracticeLanguage, PracticeProblemLanguageBundle>>
    clarifyingQuestions: string[]
    followUps: string[]
    followUpGuide: string
    complexityAnalysis: string
    solutionGuide: string
    body: string
}

export interface PracticeListItem {
    slug: string
    title: string
    difficulty: PracticeDifficulty
    category: string
    language: PracticeLanguage
    languages: PracticeLanguage[]
    timeEstimateMinutes: number
    tags: string[]
    source: string
    summary: string
    sampleTestCount: number
    hiddenTestCount: number
}

export interface PracticeClientProblem extends PracticeListItem {
    id: string
    timeLimitMs: number
    memoryLimitMb: number
    starterCode: string
    sampleTestCases: PracticeTestCase[]
    languageDetails: Partial<Record<PracticeLanguage, {
        label: string
        starterCode: string
        sampleTestCases: PracticeTestCase[]
        solutionGuide: string
    }>>
    clarifyingQuestions: string[]
    followUps: string[]
    followUpGuide: string
    complexityAnalysis: string
    solutionGuide: string
    body: string
}

const practiceRoot = join(process.cwd(), "src/content/practice")
const difficulties: PracticeDifficulty[] = ["Easy", "Medium", "Hard"]
const testVisibilities: PracticeTestVisibility[] = ["sample", "hidden"]
const checkOperators: PracticeCheckOperator[] = ["==", "!=", "<", "<=", ">", ">=", "is", "is not", "in", "not in"]

function readString(metadata: ContentBundleMetadata, key: string): string {
    const value = metadata[key]
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Practice problem metadata needs string "${key}"`)
    }
    return value.trim()
}

function readNumber(metadata: ContentBundleMetadata, key: string, fallback?: number): number {
    const value = metadata[key]
    if (typeof value === "undefined" && typeof fallback === "number") return fallback
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Practice problem metadata needs number "${key}"`)
    }
    return value
}

function readStringArray(metadata: ContentBundleMetadata, key: string): string[] {
    const value = metadata[key]
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error(`Practice problem metadata needs string[] "${key}"`)
    }
    return value.map((item) => item.trim()).filter(Boolean)
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
    const value = record[key]
    if (typeof value === "undefined") return undefined
    if (typeof value !== "string") {
        throw new Error(`Practice problem metadata "${key}" must be a string`)
    }
    const trimmed = value.trim()
    return trimmed || undefined
}

function readCode(value: unknown, key: string): string {
    if (typeof value === "string") return value.trimEnd()
    if (Array.isArray(value) && value.every((line) => typeof line === "string")) {
        return value.join("\n").trimEnd()
    }
    throw new Error(`Practice problem metadata "${key}" must be a string or string[]`)
}

function readGuide(value: unknown, key: string): string {
    return normalizePracticeGuideText(readCode(value, key))
}

function readOptionalCode(record: Record<string, unknown>, key: string, label = key): string | undefined {
    if (typeof record[key] === "undefined") return undefined
    return readCode(record[key], label)
}

function readDifficulty(value: unknown): PracticeDifficulty {
    if (difficulties.includes(value as PracticeDifficulty)) return value as PracticeDifficulty
    throw new Error(`Practice problem metadata difficulty must be one of ${difficulties.join(", ")}`)
}

function readLanguage(value: unknown): PracticeLanguage {
    if (typeof value === "string" && value in PRACTICE_LANGUAGES) return value as PracticeLanguage
    throw new Error(`Practice problem metadata language must be one of ${Object.keys(PRACTICE_LANGUAGES).join(", ")}`)
}

function readTestChecks(value: unknown, keyPrefix: string): PracticeTestCheck[] | undefined {
    if (typeof value === "undefined") return undefined
    if (!Array.isArray(value)) {
        throw new Error(`Practice problem metadata "${keyPrefix}" must be an array`)
    }

    return value.map((raw, index) => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
            throw new Error(`Practice check ${keyPrefix}[${index}] must be an object`)
        }
        const record = raw as Record<string, unknown>
        const input = record.input
        const expression = record.expression
        const expected = record.expected
        const operator = typeof record.operator === "string" ? record.operator : "=="
        if (typeof input !== "string" || !input.trim()) {
            throw new Error(`Practice check ${keyPrefix}[${index}] needs input`)
        }
        if (typeof expression !== "string" || !expression.trim()) {
            throw new Error(`Practice check ${keyPrefix}[${index}] needs expression`)
        }
        if (typeof expected !== "string" || !expected.trim()) {
            throw new Error(`Practice check ${keyPrefix}[${index}] needs expected`)
        }
        if (!checkOperators.includes(operator as PracticeCheckOperator)) {
            throw new Error(`Practice check ${keyPrefix}[${index}] has invalid operator`)
        }

        return {
            input: input.trim(),
            expression: expression.trim(),
            expected: expected.trim(),
            operator: operator as PracticeCheckOperator,
            before: readOptionalCode(record, "before", `${keyPrefix}[${index}].before`),
            feedback: readOptionalString(record, "feedback"),
        }
    })
}

function readTestCases(value: unknown): PracticeTestCase[] {
    if (!Array.isArray(value)) {
        throw new Error('Practice problem metadata needs "testCases" array')
    }

    return value.map((raw, index) => {
        if (!raw || typeof raw !== "object") {
            throw new Error(`Practice test case ${index} must be an object`)
        }

        const record = raw as Record<string, unknown>
        const name = record.name
        const visibility = record.visibility
        if (typeof name !== "string" || !name.trim()) {
            throw new Error(`Practice test case ${index} needs name`)
        }
        if (!testVisibilities.includes(visibility as PracticeTestVisibility)) {
            throw new Error(`Practice test case ${index} has invalid visibility`)
        }

        const code = readOptionalCode(record, "code", `testCases[${index}].code`)
        let checks = readTestChecks(record.checks, `testCases[${index}].checks`)
        const setup = readOptionalCode(record, "setup", `testCases[${index}].setup`)
        const input = readOptionalString(record, "input")
        const expected = readOptionalString(record, "expected")
        const expression = readOptionalString(record, "expression")
        const expectedExpression = readOptionalString(record, "expectedExpression")
        const before = readOptionalCode(record, "before", `testCases[${index}].before`)
        const feedback = readOptionalString(record, "feedback")
        const operator = typeof record.operator === "string" ? record.operator : "=="

        if (!checks?.length && !code && input && expected) {
            if (!checkOperators.includes(operator as PracticeCheckOperator)) {
                throw new Error(`Practice test case ${index} has invalid operator`)
            }
            checks = [{
                input,
                expression: expression ?? input,
                expected: expectedExpression ?? expected,
                operator: operator as PracticeCheckOperator,
                before,
                feedback,
            }]
        }
        if (!code && !checks?.length) {
            throw new Error(`Practice test case ${index} needs an input/expected pair, checks, or code`)
        }

        return {
            name: name.trim(),
            visibility: visibility as PracticeTestVisibility,
            code,
            setup,
            checks,
            description: readOptionalString(record, "description"),
            input,
            expected,
            feedback,
        }
    })
}

function assertLanguageBundle(slug: string, language: PracticeLanguage, bundle: PracticeProblemLanguageBundle) {
    if (!bundle.testCases.some((testCase) => testCase.visibility === "sample")) {
        throw new Error(`Practice problem ${slug} ${language} needs at least one sample test`)
    }
    if (!bundle.testCases.some((testCase) => testCase.visibility === "hidden")) {
        throw new Error(`Practice problem ${slug} ${language} needs at least one hidden test`)
    }
}

function readLanguageBundle(raw: Record<string, unknown>, keyPrefix: string): PracticeProblemLanguageBundle {
    return {
        starterCode: readCode(raw.starterCode, `${keyPrefix}.starterCode`),
        testCases: readTestCases(raw.testCases),
        solutionGuide: readGuide(raw.solutionGuide ?? "", `${keyPrefix}.solutionGuide`),
    }
}

function readLanguageBundles(slug: string, metadata: ContentBundleMetadata, defaultLanguage: PracticeLanguage): Partial<Record<PracticeLanguage, PracticeProblemLanguageBundle>> {
    const topLevelBundle = readLanguageBundle(metadata, "metadata")
    const bundles: Partial<Record<PracticeLanguage, PracticeProblemLanguageBundle>> = {
        [defaultLanguage]: topLevelBundle,
    }

    if (metadata.languages !== undefined && (!metadata.languages || typeof metadata.languages !== "object" || Array.isArray(metadata.languages))) {
        throw new Error('Practice problem metadata "languages" must be an object')
    }

    if (metadata.languages) {
        for (const [languageKey, rawValue] of Object.entries(metadata.languages as Record<string, unknown>)) {
            const language = readLanguage(languageKey)
            if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) {
                throw new Error(`Practice problem metadata languages.${language} must be an object`)
            }
            bundles[language] = readLanguageBundle(rawValue as Record<string, unknown>, `languages.${language}`)
        }
    }

    if (!bundles.java && JAVA_PRACTICE_BUNDLES[slug]) {
        bundles.java = JAVA_PRACTICE_BUNDLES[slug]
    }

    return bundles
}

function normalizeHeadingText(value: string): string {
    return value
        .replace(/[`*_~[\]()]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
}

function stripDuplicateLeadingTitle(body: string, title: string): string {
    const lines = body.split(/\r?\n/)
    const headingIndex = lines.findIndex((line) => line.trim())
    if (headingIndex === -1) return body

    const heading = lines[headingIndex].match(/^#\s+(.+?)\s*#*\s*$/)
    if (!heading || normalizeHeadingText(heading[1]) !== normalizeHeadingText(title)) return body

    return lines.slice(headingIndex + 1).join("\n").trimStart()
}

function loadPracticeProblem(dirName: string): PracticeProblem | null {
    const bundle = loadContentBundle(join(practiceRoot, dirName), "website")
    if (!bundle) return null

    const { metadata } = bundle
    const slug = readString(metadata, "slug")
    const title = readString(metadata, "title")
    if (slug !== dirName) {
        throw new Error(`Practice problem ${dirName} metadata slug must match directory name`)
    }

    const language = readLanguage(metadata.language)
    const languages = readLanguageBundles(slug, metadata, language)
    const defaultBundle = languages[language]
    if (!defaultBundle) {
        throw new Error(`Practice problem ${slug} is missing default language bundle ${language}`)
    }

    const problem: PracticeProblem = {
        id: readString(metadata, "id"),
        slug,
        title,
        difficulty: readDifficulty(metadata.difficulty),
        category: readString(metadata, "category"),
        language,
        timeEstimateMinutes: readNumber(metadata, "timeEstimateMinutes", 35),
        timeLimitMs: readNumber(metadata, "timeLimitMs", 2500),
        memoryLimitMb: readNumber(metadata, "memoryLimitMb", 128),
        order: readNumber(metadata, "order", 999),
        tags: readStringArray(metadata, "tags"),
        source: readString(metadata, "source"),
        summary: readString(metadata, "summary"),
        starterCode: defaultBundle.starterCode,
        testCases: defaultBundle.testCases,
        languages,
        clarifyingQuestions: readStringArray(metadata, "clarifyingQuestions"),
        followUps: readStringArray(metadata, "followUps"),
        followUpGuide: readCode(metadata.followUpGuide ?? "", "followUpGuide"),
        complexityAnalysis: readGuide(metadata.complexityAnalysis ?? "", "complexityAnalysis"),
        solutionGuide: defaultBundle.solutionGuide,
        body: stripDuplicateLeadingTitle(bundle.body, title),
    }

    for (const [languageKey, languageBundle] of Object.entries(problem.languages)) {
        assertLanguageBundle(slug, languageKey as PracticeLanguage, languageBundle)
    }

    return problem
}

let cachedProblems: PracticeProblem[] | null = null
const cachedProblemBySlug = new Map<string, PracticeProblem>()

function isProductionEnv(): boolean {
    return process.env.NODE_ENV === "production"
}

export function getPracticeProblems(): PracticeProblem[] {
    if (isProductionEnv() && cachedProblems) return cachedProblems
    if (!existsSync(/* turbopackIgnore: true */ practiceRoot)) return []

    const problems = readdirSync(/* turbopackIgnore: true */ practiceRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => loadPracticeProblem(entry.name))
        .filter((problem): problem is PracticeProblem => Boolean(problem))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

    if (isProductionEnv()) {
        cachedProblems = problems
        cachedProblemBySlug.clear()
        for (const problem of problems) {
            cachedProblemBySlug.set(problem.slug, problem)
        }
    }

    return problems
}

export function getPracticeProblem(slug: string): PracticeProblem | null {
    if (!/^[a-z0-9-]+$/.test(slug)) return null
    if (isProductionEnv()) {
        const cached = cachedProblemBySlug.get(slug)
        if (cached) return cached
        if (cachedProblems) return null
        const loaded = loadPracticeProblem(slug)
        if (loaded) cachedProblemBySlug.set(slug, loaded)
        return loaded
    }
    return loadPracticeProblem(slug)
}

export function getPracticeProblemSlugs(): string[] {
    return getPracticeProblems().map((problem) => problem.slug)
}

export function toPracticeListItem(problem: PracticeProblem): PracticeListItem {
    return {
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        language: problem.language,
        languages: Object.keys(problem.languages) as PracticeLanguage[],
        timeEstimateMinutes: problem.timeEstimateMinutes,
        tags: problem.tags,
        source: problem.source,
        summary: problem.summary,
        sampleTestCount: problem.testCases.filter((testCase) => testCase.visibility === "sample").length,
        hiddenTestCount: problem.testCases.filter((testCase) => testCase.visibility === "hidden").length,
    }
}

export function toPracticeClientProblem(problem: PracticeProblem): PracticeClientProblem {
    const languageDetails = Object.fromEntries(
        Object.entries(problem.languages).map(([language, bundle]) => [
            language,
            {
                label: PRACTICE_LANGUAGES[language as PracticeLanguage].label,
                starterCode: bundle.starterCode,
                sampleTestCases: bundle.testCases.filter((testCase) => testCase.visibility === "sample"),
                solutionGuide: bundle.solutionGuide,
            },
        ])
    ) as PracticeClientProblem["languageDetails"]

    return {
        ...toPracticeListItem(problem),
        id: problem.id,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        starterCode: problem.starterCode,
        sampleTestCases: problem.testCases.filter((testCase) => testCase.visibility === "sample"),
        languageDetails,
        clarifyingQuestions: problem.clarifyingQuestions,
        followUps: problem.followUps,
        followUpGuide: problem.followUpGuide,
        complexityAnalysis: problem.complexityAnalysis,
        solutionGuide: problem.solutionGuide,
        body: problem.body,
    }
}

export function getPracticeProblemLanguage(problem: PracticeProblem, language: PracticeLanguage): PracticeProblemLanguageBundle | null {
    return problem.languages[language] ?? null
}

export function getPracticeCategories(problems = getPracticeProblems()): string[] {
    return [...new Set(problems.map((problem) => problem.category))].sort()
}
