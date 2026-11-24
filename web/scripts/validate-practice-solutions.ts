import { getPracticeProblemLanguage, getPracticeProblems, type PracticeProblem, type PracticeProblemLanguageBundle } from "../src/lib/practice"
import { PRACTICE_LANGUAGES, type PracticeLanguage } from "../src/lib/practice-languages"
import { runPracticeCode, type PracticeCaseResult } from "../src/lib/practice-runner"

const requiredLanguages = Object.keys(PRACTICE_LANGUAGES) as PracticeLanguage[]
const javaAssertionPattern = /\b(?:check|eq)\s*\(/
const DEFAULT_CONCURRENCY = Math.max(1, Number(process.env.PRACTICE_VALIDATE_CONCURRENCY || "4"))

async function runConcurrent<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
    const results: T[] = new Array(tasks.length)
    let index = 0

    async function worker() {
        while (index < tasks.length) {
            const current = index++
            results[current] = await tasks[current]()
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker))
    return results
}

function extractSolution(problem: PracticeProblem, language: PracticeLanguage, bundle: PracticeProblemLanguageBundle): string {
    const fenceLanguage = PRACTICE_LANGUAGES[language].solutionFence
    const fence = bundle.solutionGuide.match(new RegExp("```" + fenceLanguage + "\\s*\\n([\\s\\S]*?)```"))
    if (!fence?.[1]?.trim()) {
        throw new Error(`${problem.slug}: ${language} solutionGuide needs a ${fenceLanguage} code fence`)
    }
    return fence[1].trimEnd()
}

function assertTestShape(problem: PracticeProblem, language: PracticeLanguage, bundle: PracticeProblemLanguageBundle): string[] {
    const errors: string[] = []
    const sampleCount = bundle.testCases.filter((testCase) => testCase.visibility === "sample").length
    const hiddenCount = bundle.testCases.filter((testCase) => testCase.visibility === "hidden").length
    const names = new Set<string>()

    if (sampleCount === 0) {
        errors.push(`${problem.slug}: ${language} needs a sample test for Run`)
    }
    if (hiddenCount === 0) {
        errors.push(`${problem.slug}: ${language} needs a hidden test for Submit`)
    }

    for (const testCase of bundle.testCases) {
        const label = `${problem.slug}: ${language} "${testCase.name}"`
        if (!testCase.name.trim()) errors.push(`${label} needs a name`)
        if (testCase.visibility !== "sample" && testCase.visibility !== "hidden") {
            errors.push(`${label} has invalid published visibility`)
        }
        if (!testCase.code?.trim() && !testCase.checks?.length) {
            errors.push(`${label} needs executable code or structured checks`)
        }
        for (const check of testCase.checks ?? []) {
            if (!check.input.trim() || !check.expression.trim() || !check.expected.trim()) {
                errors.push(`${label} structured check needs input, expression, and expected`)
            }
            if (language === "java" && check.operator !== "==") {
                errors.push(`${label} uses unsupported structured Java operator "${check.operator}"`)
            }
        }
        if (names.has(testCase.name)) {
            errors.push(`${problem.slug}: ${language} duplicate test name "${testCase.name}"`)
        }
        names.add(testCase.name)
        if (language === "python3" && testCase.code && !testCase.code.includes("from solution import ")) {
            errors.push(`${problem.slug}: ${language} "${testCase.name}" should import from solution`)
        }
        if (language === "python3" && !testCase.code && testCase.setup && !testCase.setup.includes("from solution import ")) {
            errors.push(`${problem.slug}: ${language} "${testCase.name}" setup should import from solution`)
        }
        if (language === "java" && !testCase.code && testCase.setup && javaAssertionPattern.test(testCase.setup)) {
            errors.push(`${problem.slug}: ${language} "${testCase.name}" setup must not contain check() or eq() assertions`)
        }
        if (language === "java" && !testCase.code) {
            for (const check of testCase.checks ?? []) {
                if (check.before && javaAssertionPattern.test(check.before)) {
                    errors.push(`${problem.slug}: ${language} "${testCase.name}" check setup must not contain check() or eq() assertions`)
                }
            }
        }
    }

    return errors
}

function formatCaseFailure(problem: PracticeProblem, language: PracticeLanguage, result: PracticeCaseResult): string {
    const lines = [
        `${problem.slug}: ${language} failed "${result.name}" (${result.visibility})`,
    ]

    if (result.description) lines.push(`case: ${result.description}`)
    if (result.input) lines.push(`input:\n${result.input}`)
    if (result.assertion) {
        lines.push(`expected (${result.assertion.operator}):\n${result.assertion.expected}`)
        lines.push(`actual:\n${result.assertion.actual}`)
    } else if (result.expected) {
        lines.push(`expected:\n${result.expected}`)
    }
    if (result.errorLine) lines.push(`failed line ${result.errorLineNumber ?? "?"}: ${result.errorLine}`)
    if (result.stdout) lines.push(`stdout:\n${result.stdout.trim()}`)
    if (result.stderr) lines.push(`stderr:\n${result.stderr.trim()}`)
    if (result.feedback) lines.push(`feedback:\n${result.feedback}`)
    if (result.error) lines.push(`error:\n${result.error.trim()}`)

    return lines.join("\n")
}

async function main() {
    const problems = getPracticeProblems()
    const errors: string[] = []

    if (problems.length === 0) {
        errors.push("practice suite has no problems")
    }

    for (const problem of problems) {
        for (const language of requiredLanguages) {
            const bundle = getPracticeProblemLanguage(problem, language)
            if (!bundle) {
                errors.push(`${problem.slug}: missing ${language} language bundle`)
                continue
            }
            errors.push(...assertTestShape(problem, language, bundle))
        }
    }

    interface ValidationTask {
        problem: PracticeProblem
        language: PracticeLanguage
        bundle: PracticeProblemLanguageBundle
        code: string
    }

    const validationTasks: ValidationTask[] = []

    for (const problem of problems) {
        for (const language of requiredLanguages) {
            const bundle = getPracticeProblemLanguage(problem, language)
            if (!bundle) continue

            let code: string
            try {
                code = extractSolution(problem, language, bundle)
            } catch (error) {
                errors.push(error instanceof Error ? error.message : String(error))
                continue
            }

            validationTasks.push({ problem, language, bundle, code })
        }
    }

    const executeTask = async ({ problem, language, bundle, code }: ValidationTask) => {
        const result = await runPracticeCode({ problem, code, mode: "submit", language })
        return { problem, language, bundle, code, result }
    }

    const taskResults = await runConcurrent(
        validationTasks.map((task) => () => executeTask(task)),
        DEFAULT_CONCURRENCY,
    )

    // Retry any concurrent timeout once sequentially to rule out CPU contention flakes.
    for (let i = 0; i < taskResults.length; i++) {
        const entry = taskResults[i]
        const timedOut = !entry.result.ok
            && (entry.result.error?.includes("Timed out")
                || entry.result.results.some((r) => !r.passed && r.error?.includes("Timed out")))
        if (timedOut && DEFAULT_CONCURRENCY > 1) {
            taskResults[i] = await executeTask(validationTasks[i])
        }
    }

    for (const { problem, language, bundle, result } of taskResults) {
        const sampleCount = bundle.testCases.filter((testCase) => testCase.visibility === "sample").length
        const hiddenCount = bundle.testCases.filter((testCase) => testCase.visibility === "hidden").length
        if (result.ok) {
            console.log(`ok ${problem.slug} ${language} samples=${sampleCount} hidden=${hiddenCount} passed=${result.passed}/${result.total}`)
            continue
        }

        errors.push(`${problem.slug}: ${language} sample solution failed ${result.passed}/${result.total}`)
        if (result.error) {
            errors.push(`${problem.slug}: ${language} ${result.error}`)
        }
        for (const testResult of result.results.filter((testResult) => !testResult.passed)) {
            errors.push(formatCaseFailure(problem, language, testResult))
        }
    }

    if (errors.length > 0) {
        console.error(`\nPractice validation failed with ${errors.length} error(s):`)
        for (const error of errors) {
            console.error(`- ${error}`)
        }
        process.exit(1)
    }

    console.log(`validated ${problems.length} practice problems`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
