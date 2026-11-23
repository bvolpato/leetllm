import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

type Args = {
    slug: string
    title: string
    category: string
    difficulty: "Easy" | "Medium" | "Hard"
    order: number
}

function usage(exitCode = 1): never {
    console.error([
        "Usage:",
        "  pnpm practice:new <slug> --title \"Problem Title\" --category \"Repository Systems\" --difficulty Medium",
        "",
        "Optional:",
        "  --order 48",
    ].join("\n"))
    process.exit(exitCode)
}

function titleFromSlug(slug: string): string {
    return slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function parseArgs(argv: string[]): Args {
    if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) usage(argv.length === 0 ? 1 : 0)

    const slug = argv[0]
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) usage()

    const flags = new Map<string, string>()
    for (let index = 1; index < argv.length; index += 2) {
        const key = argv[index]
        const value = argv[index + 1]
        if (!key?.startsWith("--") || !value) usage()
        flags.set(key.slice(2), value)
    }

    const difficulty = flags.get("difficulty") ?? "Medium"
    if (!["Easy", "Medium", "Hard"].includes(difficulty)) usage()

    const order = Number(flags.get("order") ?? nextOrder())
    if (!Number.isInteger(order) || order < 1) usage()

    return {
        slug,
        title: flags.get("title") ?? titleFromSlug(slug),
        category: flags.get("category") ?? "Practice",
        difficulty: difficulty as Args["difficulty"],
        order,
    }
}

function nextOrder(): number {
    const root = join(process.cwd(), "src/content/practice")
    let maxOrder = 0
    for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const metadataPath = join(root, entry.name, "metadata.json")
        if (!existsSync(metadataPath)) continue
        const metadata = JSON.parse(readFileSync(metadataPath, "utf-8")) as { order?: unknown }
        if (typeof metadata.order === "number" && metadata.order > maxOrder) maxOrder = metadata.order
    }
    return maxOrder + 1
}

function metadata(args: Args): string {
    const object = {
        id: args.slug,
        slug: args.slug,
        title: args.title,
        difficulty: args.difficulty,
        category: args.category,
        language: "python3",
        timeEstimateMinutes: 35,
        timeLimitMs: 2500,
        memoryLimitMb: 128,
        order: args.order,
        tags: ["systems", "interview"],
        source: "Frontier coding prep",
        summary: "Implement the requested behavior with deterministic output and clear edge-case handling.",
        starterCode: [
            "def solve(input_data: str) -> str:",
            "    pass",
        ],
        testCases: [
            {
                name: "public handles basic input",
                visibility: "sample",
                description: "The basic case should return the input unchanged.",
                input: "solve(\"hello\")",
                expected: "\"hello\"",
                feedback: "Start with the simplest valid input before adding edge cases.",
                setup: [
                    "from solution import solve",
                ],
            },
            {
                name: "public handles empty input",
                visibility: "sample",
                description: "The empty input should produce an empty output.",
                input: "solve(\"\")",
                expected: "\"\"",
                feedback: "Check boundary values explicitly.",
                setup: [
                    "from solution import solve",
                ],
            },
            {
                name: "public handles one character",
                visibility: "sample",
                description: "A one-character input should pass through unchanged.",
                input: "solve(\"x\")",
                expected: "\"x\"",
                setup: [
                    "from solution import solve",
                ],
            },
            {
                name: "hidden handles edge input",
                visibility: "hidden",
                input: "solve(\"edge\")",
                expected: "\"edge\"",
                setup: [
                    "from solution import solve",
                ],
            },
            {
                name: "hidden handles repeated characters",
                visibility: "hidden",
                input: "solve(\"aaa\")",
                expected: "\"aaa\"",
                setup: [
                    "from solution import solve",
                ],
            },
            {
                name: "hidden handles punctuation",
                visibility: "hidden",
                input: "solve(\"a-b\")",
                expected: "\"a-b\"",
                setup: [
                    "from solution import solve",
                ],
            },
            {
                name: "hidden handles whitespace",
                visibility: "hidden",
                input: "solve(\"a b\")",
                expected: "\"a b\"",
                setup: [
                    "from solution import solve",
                ],
            },
            {
                name: "hidden handles unicode",
                visibility: "hidden",
                input: "solve(\"café\")",
                expected: "\"café\"",
                setup: [
                    "from solution import solve",
                ],
            },
        ],
        languages: {
            java: {
                starterCode: [
                    "class Solution {",
                    "    static String solve(String input) {",
                    "        return \"\";",
                    "    }",
                    "}",
                ],
                testCases: [
                    {
                        name: "public handles basic input",
                        visibility: "sample",
                        description: "The basic case should return the input unchanged.",
                        input: "Solution.solve(\"hello\")",
                        expected: "\"hello\"",
                        feedback: "Start with the simplest valid input before adding edge cases.",
                    },
                    {
                        name: "public handles empty input",
                        visibility: "sample",
                        description: "The empty input should produce an empty output.",
                        input: "Solution.solve(\"\")",
                        expected: "\"\"",
                        feedback: "Check boundary values explicitly.",
                    },
                    {
                        name: "public handles one character",
                        visibility: "sample",
                        input: "Solution.solve(\"x\")",
                        expected: "\"x\"",
                    },
                    {
                        name: "hidden handles edge input",
                        visibility: "hidden",
                        input: "Solution.solve(\"edge\")",
                        expected: "\"edge\"",
                    },
                    {
                        name: "hidden handles repeated characters",
                        visibility: "hidden",
                        input: "Solution.solve(\"aaa\")",
                        expected: "\"aaa\"",
                    },
                    {
                        name: "hidden handles punctuation",
                        visibility: "hidden",
                        input: "Solution.solve(\"a-b\")",
                        expected: "\"a-b\"",
                    },
                    {
                        name: "hidden handles whitespace",
                        visibility: "hidden",
                        input: "Solution.solve(\"a b\")",
                        expected: "\"a b\"",
                    },
                    {
                        name: "hidden handles unicode",
                        visibility: "hidden",
                        input: "Solution.solve(\"café\")",
                        expected: "\"café\"",
                    },
                ],
                solutionGuide: [
                    "```java",
                    "class Solution {",
                    "    static String solve(String input) {",
                    "        return input;",
                    "    }",
                    "}",
                    "```",
                ],
            },
        },
        clarifyingQuestions: [
            "What should happen for empty input?",
            "Should output ordering be deterministic?",
            "How large can the input get?",
        ],
        followUps: [
            "Add streaming input support.",
            "Return richer diagnostics for invalid input.",
        ],
        followUpGuide: [
            "For streaming input, keep only the state needed for the next decision.",
            "",
            "For diagnostics, return structured errors instead of mixing errors into normal output.",
        ],
        complexityAnalysis: [
            "- Direct pass. Time: O(n), where n is input length. Space: O(n) for the returned string.",
            "- Streaming follow-up. Time stays O(n). Space can drop to O(1) outside output storage.",
        ],
        solutionGuide: [
            "Use the smallest direct implementation first, then extend the tests and solution together.",
            "",
            "```python",
            "def solve(input_data: str) -> str:",
            "    return input_data",
            "```",
        ],
    }

    return `${JSON.stringify(object, null, 2)}\n`
}

function content(args: Args): string {
    return [
        `Implement \`${args.title}\` with deterministic output and clear behavior for boundary cases.`,
        "",
        "Focus on the contract first:",
        "",
        "- parse the input shape",
        "- preserve stable ordering",
        "- handle empty and repeated values",
        "- keep errors explicit",
        "",
        "Use the sample tests as the visible interview examples, then add hidden tests for edge cases and regression coverage.",
        "",
    ].join("\n")
}

function main() {
    const args = parseArgs(process.argv.slice(2))
    const dir = join(process.cwd(), "src/content/practice", args.slug)

    if (existsSync(dir)) {
        throw new Error(`Practice problem already exists: ${args.slug}`)
    }

    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "metadata.json"), metadata(args), "utf-8")
    writeFileSync(join(dir, "content.md"), content(args), "utf-8")
    console.log(`created src/content/practice/${args.slug}`)
    console.log("next: edit metadata.json tests, then run pnpm practice:validate")
}

main()
