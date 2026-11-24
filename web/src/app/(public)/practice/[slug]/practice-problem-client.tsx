"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useTheme } from "next-themes"
import type { SyntaxHighlighterProps } from "react-syntax-highlighter"
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light"
import pythonPrism from "react-syntax-highlighter/dist/esm/languages/prism/python"
import javaPrism from "react-syntax-highlighter/dist/esm/languages/prism/java"
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light"
import { ArrowLeft, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Code2, GripHorizontal, GripVertical, Loader2, MemoryStick, PanelBottomClose, PanelBottomOpen, PanelLeftClose, PanelLeftOpen, Play, RotateCcw, Send, TestTube2, X, XCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PracticeCodeEditorProps } from "@/components/practice/practice-code-editor"
import { usePracticeProgress } from "@/components/practice/practice-progress"
import {
    filterAndSortPracticeProblems,
    parsePracticeListState,
    practiceListHref,
    practiceProblemHref,
    practiceQueryStringToSearch,
} from "@/lib/practice-list-state"
import { PRACTICE_LANGUAGES } from "@/lib/practice-languages"
import type { PracticeLanguage } from "@/lib/practice-languages"
import type { PracticeClientProblem, PracticeDifficulty, PracticeListItem, PracticeTestCase, PracticeTestCheck } from "@/lib/practice"
import type { PracticeRunMode, PracticeRunResult } from "@/lib/practice-runner"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/lib/analytics"

SyntaxHighlighter.registerLanguage("python", pythonPrism)
SyntaxHighlighter.registerLanguage("java", javaPrism)

const PracticeCodeEditor = dynamic<PracticeCodeEditorProps>(
    () => import("@/components/practice/practice-code-editor").then((mod) => mod.PracticeCodeEditor),
    {
        ssr: false,
        loading: () => (
            <div
                role="status"
                aria-label="Loading code editor"
                className="flex h-full w-full flex-col gap-2.5 bg-background p-4 font-mono text-xs text-muted-foreground"
            >
                <div className="h-4 w-40 animate-pulse rounded bg-muted/60" />
                <div className="h-4 w-64 animate-pulse rounded bg-muted/45" />
                <div className="h-4 w-52 animate-pulse rounded bg-muted/35" />
            </div>
        ),
    },
)

const difficultyClass: Record<PracticeDifficulty, string> = {
    Easy: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300",
    Medium: "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:border-amber-500/30 dark:text-amber-300",
    Hard: "border-red-600/30 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:text-red-300",
}

function solutionStorageKey(slug: string, language: PracticeLanguage) {
    return `leetllm_practice_solution_${slug}_${language}`
}

function legacySolutionStorageKey(slug: string) {
    return `leetllm_practice_solution_${slug}`
}

function languageStorageKey(slug: string) {
    return `leetllm_practice_language_${slug}`
}

function customTestStorageKey(slug: string, language: PracticeLanguage) {
    return `leetllm_practice_custom_test_${slug}_${language}`
}

const problemPaneVisibilityStorageKey = "leetllm_practice_problem_pane_visible"
const customTestPaneVisibilityStorageKey = "leetllm_practice_custom_test_pane_visible"

function testCaseExecutableCode(testCase: PracticeTestCase, language: PracticeLanguage) {
    if (testCase.code) return testCase.code
    const lines: string[] = []
    if (testCase.setup) lines.push(testCase.setup)
    for (const check of testCase.checks ?? []) {
        if (check.before) lines.push(check.before)
        if (language === "java") {
            if (check.operator === "==") {
                lines.push(`eq(${check.expression}, ${check.expected});`)
            } else {
                lines.push(`// ${check.input}`)
                lines.push(`// Expected ${check.operator} ${check.expected}`)
            }
        } else {
            lines.push(`assert ${check.expression} ${check.operator} ${check.expected}`)
        }
    }
    return lines.join("\n").trimEnd()
}

function readStoredSolution(slug: string, language: PracticeLanguage, starterCode: string) {
    const stored = localStorage.getItem(solutionStorageKey(slug, language))
    if (stored !== null) return stored
    const legacyStored = localStorage.getItem(legacySolutionStorageKey(slug))
    if (language === "python3" && legacyStored !== null) return legacyStored
    return starterCode
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

const problemResizeHandleWidth = 10
const resultsResizeHandleHeight = 32
const minProblemPaneWidth = 300
const defaultProblemPaneWidth = 360
const defaultResultsPaneHeight = 220

function maxProblemPaneWidth(layoutWidth: number) {
    return Math.max(minProblemPaneWidth, Math.min(520, layoutWidth - problemResizeHandleWidth - 520, Math.round(layoutWidth * 0.48)))
}

function maxResultsPaneHeight(editorColumnHeight: number) {
    return Math.max(180, Math.min(360, editorColumnHeight - resultsResizeHandleHeight - 320))
}

type PracticeLayoutStyle = CSSProperties & {
    "--problem-pane-width": string
    "--results-pane-height": string
}

export function PracticeProblemClient({
    problem,
    problems,
    initialSearch = "",
    renderedBody,
    renderedComplexityAnalysis,
    renderedSolutionGuides,
    renderedFollowUpGuide,
}: {
    problem: PracticeClientProblem
    problems: PracticeListItem[]
    initialSearch?: string
    renderedBody?: ReactNode
    renderedComplexityAnalysis?: ReactNode
    renderedSolutionGuides?: Partial<Record<PracticeLanguage, ReactNode>>
    renderedFollowUpGuide?: ReactNode
}) {
    const { resolvedTheme } = useTheme()
    const { isLearned, markAsLearned, markAsUnlearned } = usePracticeProgress()
    const [currentSearch, setCurrentSearch] = useState(initialSearch)
    const effectiveSearch = initialSearch || currentSearch
    const layoutRef = useRef<HTMLDivElement | null>(null)
    const editorColumnRef = useRef<HTMLElement | null>(null)
    const didHydrateStoredCode = useRef(false)
    const availableLanguages = useMemo(() => problem.languages.filter((language) => problem.languageDetails[language]), [problem.languageDetails, problem.languages])
    const [selectedLanguage, setSelectedLanguage] = useState<PracticeLanguage>(problem.language)
    const [solutionGuideLanguage, setSolutionGuideLanguage] = useState<PracticeLanguage>(problem.language)
    const [code, setCode] = useState(problem.starterCode)
    const [customTestCode, setCustomTestCode] = useState("")
    const [result, setResult] = useState<PracticeRunResult | null>(null)
    const [runningMode, setRunningMode] = useState<PracticeRunMode | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [problemPaneWidth, setProblemPaneWidth] = useState(defaultProblemPaneWidth)
    const [resultsPaneHeight, setResultsPaneHeight] = useState(defaultResultsPaneHeight)
    const [problemPaneVisible, setProblemPaneVisible] = useState(true)
    const [customTestPaneVisible, setCustomTestPaneVisible] = useState(false)
    const [resultsPaneVisible, setResultsPaneVisible] = useState(false)
    const didHydrateLayout = useRef(false)
    const didUserChangeLayout = useRef(false)

    const selectedLanguageDetails = problem.languageDetails[selectedLanguage] ?? problem.languageDetails[problem.language]
    const solutionGuideDetails = problem.languageDetails[solutionGuideLanguage] ?? selectedLanguageDetails
    const editorLabel = `${problem.title} ${PRACTICE_LANGUAGES[selectedLanguage].label} solution editor`
    const customTestLabel = `${problem.title} ${PRACTICE_LANGUAGES[selectedLanguage].label} custom test editor`
    const isLightTheme = resolvedTheme === "light"
    const categories = useMemo(() => ["All", ...new Set(problems.map((item) => item.category))], [problems])
    const initialSearchParams = useMemo(() => new URLSearchParams(effectiveSearch), [effectiveSearch])
    const listState = useMemo(() => parsePracticeListState(initialSearchParams, categories), [categories, initialSearchParams])
    const contextProblems = useMemo(() => {
        const filtered = filterAndSortPracticeProblems(problems, listState, isLearned)
        if (filtered.some((item) => item.slug === problem.slug)) return filtered
        return filterAndSortPracticeProblems(problems, { ...listState, status: "All" }, isLearned)
    }, [isLearned, listState, problem.slug, problems])
    const currentProblemIndex = contextProblems.findIndex((item) => item.slug === problem.slug)
    const previousProblem = currentProblemIndex > 0 ? contextProblems[currentProblemIndex - 1] : null
    const nextProblem = currentProblemIndex >= 0 && currentProblemIndex < contextProblems.length - 1 ? contextProblems[currentProblemIndex + 1] : null
    const learned = isLearned(problem.slug)
    const layoutStyle = useMemo<PracticeLayoutStyle>(() => ({
        "--problem-pane-width": `${problemPaneVisible ? problemPaneWidth : 0}px`,
        "--results-pane-height": `${resultsPaneVisible ? resultsPaneHeight : 0}px`,
    }), [problemPaneVisible, problemPaneWidth, resultsPaneHeight, resultsPaneVisible])

    useEffect(() => {
        trackEvent("practice_problem_view", {
            slug: problem.slug,
            difficulty: problem.difficulty,
            category: problem.category,
        })
    }, [problem.category, problem.difficulty, problem.slug])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (!didUserChangeLayout.current) {
                const storedProblemPane = localStorage.getItem(problemPaneVisibilityStorageKey)
                const storedCustomTestPane = localStorage.getItem(customTestPaneVisibilityStorageKey)
                const tabletOrPhone = window.matchMedia?.("(max-width: 1023px)").matches ?? window.innerWidth < 1024

                setProblemPaneVisible(storedProblemPane === null ? !tabletOrPhone : storedProblemPane === "1")
                setCustomTestPaneVisible(storedCustomTestPane === "1")
            }
            didHydrateLayout.current = true
        }, 0)
        return () => window.clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!didHydrateLayout.current) return
        localStorage.setItem(problemPaneVisibilityStorageKey, problemPaneVisible ? "1" : "0")
    }, [problemPaneVisible])

    useEffect(() => {
        if (!didHydrateLayout.current) return
        localStorage.setItem(customTestPaneVisibilityStorageKey, customTestPaneVisible ? "1" : "0")
    }, [customTestPaneVisible])

    useEffect(() => {
        didHydrateStoredCode.current = false
        const timer = window.setTimeout(() => {
            const storedLanguage = localStorage.getItem(languageStorageKey(problem.slug))
            const initialLanguage = availableLanguages.includes(storedLanguage as PracticeLanguage)
                ? storedLanguage as PracticeLanguage
                : problem.language
            const details = problem.languageDetails[initialLanguage] ?? problem.languageDetails[problem.language]
            didHydrateStoredCode.current = true
            setSelectedLanguage(initialLanguage)
            setSolutionGuideLanguage(initialLanguage)
            setCode(readStoredSolution(problem.slug, initialLanguage, details?.starterCode ?? problem.starterCode))
        }, 0)
        return () => window.clearTimeout(timer)
    }, [availableLanguages, problem.language, problem.languageDetails, problem.slug, problem.starterCode])

    useEffect(() => {
        if (initialSearch) return

        function syncCurrentSearch() {
            setCurrentSearch(practiceQueryStringToSearch(window.location.search))
        }

        syncCurrentSearch()
        window.addEventListener("popstate", syncCurrentSearch)
        return () => window.removeEventListener("popstate", syncCurrentSearch)
    }, [initialSearch])

    useEffect(() => {
        if (!didHydrateStoredCode.current) return
        localStorage.setItem(solutionStorageKey(problem.slug, selectedLanguage), code)
    }, [code, problem.slug, selectedLanguage])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const details = problem.languageDetails[selectedLanguage] ?? problem.languageDetails[problem.language]
            const stored = localStorage.getItem(customTestStorageKey(problem.slug, selectedLanguage))
            const sample = details?.sampleTestCases[0]
            setCustomTestCode(stored ?? (sample ? testCaseExecutableCode(sample, selectedLanguage) : ""))
        }, 0)
        return () => window.clearTimeout(timer)
    }, [problem.language, problem.languageDetails, problem.slug, selectedLanguage])

    useEffect(() => {
        if (!customTestCode.trim()) return
        localStorage.setItem(customTestStorageKey(problem.slug, selectedLanguage), customTestCode)
    }, [customTestCode, problem.slug, selectedLanguage])

    function switchLanguage(language: PracticeLanguage) {
        if (language === selectedLanguage) return

        localStorage.setItem(solutionStorageKey(problem.slug, selectedLanguage), code)
        localStorage.setItem(languageStorageKey(problem.slug), language)
        setSelectedLanguage(language)
        setSolutionGuideLanguage(language)
        setCode(readStoredSolution(problem.slug, language, problem.languageDetails[language]?.starterCode ?? problem.starterCode))
        setResult(null)
        setError(null)
    }

    function toggleProblemPane() {
        didUserChangeLayout.current = true
        setProblemPaneVisible((visible) => {
            const next = !visible
            localStorage.setItem(problemPaneVisibilityStorageKey, next ? "1" : "0")
            return next
        })
    }

    function hideProblemPane() {
        didUserChangeLayout.current = true
        localStorage.setItem(problemPaneVisibilityStorageKey, "0")
        setProblemPaneVisible(false)
    }

    function toggleCustomTestPane() {
        didUserChangeLayout.current = true
        setCustomTestPaneVisible((visible) => {
            const next = !visible
            localStorage.setItem(customTestPaneVisibilityStorageKey, next ? "1" : "0")
            return next
        })
    }

    function hideCustomTestPane() {
        didUserChangeLayout.current = true
        localStorage.setItem(customTestPaneVisibilityStorageKey, "0")
        setCustomTestPaneVisible(false)
    }

    useEffect(() => {
        const clampLayout = () => {
            const isResizableLayout = window.matchMedia?.("(min-width: 1024px)").matches ?? window.innerWidth >= 1024
            if (!isResizableLayout) return

            const layout = layoutRef.current
            if (layout) {
                const rect = layout.getBoundingClientRect()
                setProblemPaneWidth((width) => clamp(width, minProblemPaneWidth, maxProblemPaneWidth(rect.width)))
            }

            const editorColumn = editorColumnRef.current
            if (editorColumn) {
                const rect = editorColumn.getBoundingClientRect()
                setResultsPaneHeight((height) => clamp(height, 180, maxResultsPaneHeight(rect.height)))
            }
        }

        clampLayout()
        window.addEventListener("resize", clampLayout)
        return () => window.removeEventListener("resize", clampLayout)
    }, [])

    async function run(mode: PracticeRunMode, customCode?: string) {
        if (customCode !== undefined && !customCode.trim()) {
            setError("Custom test is empty")
            setResultsPaneVisible(true)
            return
        }
        setRunningMode(mode)
        setError(null)
        setResult(null)
        setResultsPaneVisible(true)
        trackEvent("practice_started", {
            slug: problem.slug,
            mode,
            language: selectedLanguage,
            custom_test: customCode !== undefined,
        })
        try {
            const body: Record<string, unknown> = { slug: problem.slug, code, mode, language: selectedLanguage }
            if (customCode !== undefined) {
                body.customTests = [{ name: "Custom test", code: customCode }]
            }
            const response = await fetch("/api/practice/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || "Run failed")
            }
            setResult(data)
            if (data.ok) {
                trackEvent("practice_passed", {
                    slug: problem.slug,
                    mode,
                    language: selectedLanguage,
                })
            }
        } catch (runError) {
            setError(runError instanceof Error ? runError.message : "Run failed")
        } finally {
            setRunningMode(null)
        }
    }

    function startProblemPaneResize(event: ReactPointerEvent<HTMLButtonElement>) {
        const layout = layoutRef.current
        if (!layout) return

        event.preventDefault()
        const updateWidth = (clientX: number) => {
            const rect = layout.getBoundingClientRect()
            setProblemPaneWidth(clamp(Math.round(clientX - rect.left), minProblemPaneWidth, maxProblemPaneWidth(rect.width)))
        }
        const onPointerMove = (moveEvent: PointerEvent) => updateWidth(moveEvent.clientX)
        const stopResize = () => {
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", stopResize)
            window.removeEventListener("pointercancel", stopResize)
        }

        updateWidth(event.clientX)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", stopResize, { once: true })
        window.addEventListener("pointercancel", stopResize, { once: true })
    }

    function startResultsPaneResize(event: ReactPointerEvent<HTMLButtonElement>) {
        const editorColumn = editorColumnRef.current
        if (!editorColumn) return

        event.preventDefault()
        const updateHeight = (clientY: number) => {
            const rect = editorColumn.getBoundingClientRect()
            setResultsPaneHeight(clamp(Math.round(rect.bottom - clientY), 180, maxResultsPaneHeight(rect.height)))
        }
        const onPointerMove = (moveEvent: PointerEvent) => updateHeight(moveEvent.clientY)
        const stopResize = () => {
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", stopResize)
            window.removeEventListener("pointercancel", stopResize)
        }

        updateHeight(event.clientY)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", stopResize, { once: true })
        window.addEventListener("pointercancel", stopResize, { once: true })
    }

    return (
        <div className="w-full px-3 py-4 sm:px-4 lg:px-6 xl:pb-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Link href={practiceListHref(listState)}>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Practice
                        </Button>
                    </Link>
                    {previousProblem ? (
                        <Link href={practiceProblemHref(previousProblem.slug, listState)}>
                            <Button variant="outline" size="sm" className="gap-2" aria-label={`Previous problem: ${previousProblem.title}`}>
                                <ChevronLeft className="h-4 w-4" />
                                Prev
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="outline" size="sm" className="gap-2" disabled>
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                        </Button>
                    )}
                    {nextProblem ? (
                        <Link href={practiceProblemHref(nextProblem.slug, listState)}>
                            <Button variant="outline" size="sm" className="gap-2" aria-label={`Next problem: ${nextProblem.title}`}>
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="outline" size="sm" className="gap-2" disabled>
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={toggleProblemPane}
                    >
                        {problemPaneVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                        {problemPaneVisible ? "Hide Prompt" : "Show Prompt"}
                    </Button>
                    <Button
                        type="button"
                        variant={customTestPaneVisible ? "secondary" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={toggleCustomTestPane}
                    >
                        <TestTube2 className="h-4 w-4" />
                        Custom Test
                    </Button>
                    <Button
                        type="button"
                        variant={resultsPaneVisible ? "secondary" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={() => setResultsPaneVisible((visible) => !visible)}
                    >
                        {resultsPaneVisible ? <PanelBottomClose className="h-4 w-4" /> : <PanelBottomOpen className="h-4 w-4" />}
                        Results
                    </Button>
                    <Button
                        type="button"
                        variant={learned ? "secondary" : "outline"}
                        size="sm"
                        className={learned ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20" : "gap-2"}
                        onClick={() => learned ? markAsUnlearned(problem.slug) : markAsLearned(problem.slug)}
                    >
                        <Check className="h-4 w-4" />
                        {learned ? "Learned" : "Mark Learned"}
                    </Button>
                </div>
            </div>

            <div
                ref={layoutRef}
                className={cn(
                    "grid gap-y-4 lg:h-[calc(100vh-7.5rem)]",
                    problemPaneVisible
                        ? "lg:grid-cols-[minmax(300px,var(--problem-pane-width))_10px_minmax(0,1fr)]"
                        : "lg:grid-cols-[minmax(0,1fr)]"
                )}
                style={layoutStyle}
            >
                {problemPaneVisible && <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card/40">
                    <div className="shrink-0 border-b border-border/50 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <Badge variant="outline" className={difficultyClass[problem.difficulty]}>
                                    {problem.difficulty}
                                </Badge>
                                <Badge variant="outline" className="border-border/70 text-muted-foreground">
                                    {problem.category}
                                </Badge>
                                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                                    {PRACTICE_LANGUAGES[selectedLanguage].label}
                                </Badge>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-muted-foreground"
                                aria-label="Hide problem prompt"
                                title="Hide problem prompt"
                                onClick={hideProblemPane}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{problem.title}</h1>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{problem.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" />
                                {problem.timeEstimateMinutes}m
                            </span>
                            <span>{problem.sampleTestCount} sample tests</span>
                            <span>{problem.hiddenTestCount} hidden tests</span>
                        </div>
                    </div>

                    <div className="min-h-0 space-y-6 overflow-y-auto p-5">
                        <div className="practice-markdown text-sm leading-7">
                            {renderedBody ?? <div className="whitespace-pre-wrap">{problem.body}</div>}
                        </div>

                        <Accordion type="multiple" className="rounded-lg border border-border/50">
                            <AccordionItem value="samples" className="px-4">
                                <AccordionTrigger>Sample Tests</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3">
                                        {(selectedLanguageDetails?.sampleTestCases ?? problem.sampleTestCases).map((testCase) => (
                                            <div key={testCase.name} className="rounded-lg border border-border/40 bg-background/60">
                                                <div className="border-b border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground">{testCase.name}</div>
                                                {(testCase.description || testCase.input || testCase.expected) && (
                                                    <div className="border-b border-border/40 p-3">
                                                        <CaseContextBlock
                                                            description={testCase.description}
                                                            input={testCase.input}
                                                            expected={testCase.expected}
                                                        />
                                                    </div>
                                                )}
                                                {testCase.checks?.length ? (
                                                    <StructuredTestCaseBlock
                                                        setup={testCase.setup}
                                                        checks={testCase.checks}
                                                        caseInput={testCase.input}
                                                        caseExpected={testCase.expected}
                                                        language={selectedLanguage}
                                                        isLightTheme={isLightTheme}
                                                    />
                                                ) : (
                                                    <TestCaseCodeBlock
                                                        code={testCase.code ?? ""}
                                                        language={selectedLanguage}
                                                        isLightTheme={isLightTheme}
                                                    />
                                                )}
                                                {testCase.feedback && (
                                                    <div className="border-t border-border/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
                                                        {testCase.feedback}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="clarify" className="px-4">
                                <AccordionTrigger>Clarification Questions</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {problem.clarifyingQuestions.map((question) => <li key={question}>{question}</li>)}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            {problem.complexityAnalysis && (
                                <AccordionItem value="complexity" className="px-4">
                                    <AccordionTrigger>Complexity Analysis</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="practice-markdown rounded-lg bg-background/60 p-4">
                                            {renderedComplexityAnalysis ?? <div className="whitespace-pre-wrap">{problem.complexityAnalysis}</div>}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )}
                            <AccordionItem value="solution" className="px-4">
                                <AccordionTrigger>Solution Guide</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3">
                                        <div role="tablist" aria-label="Solution guide language" className="inline-flex rounded-md border border-border/60 bg-background p-0.5">
                                            {availableLanguages.map((language) => {
                                                const details = problem.languageDetails[language]
                                                if (!details) return null
                                                const active = solutionGuideLanguage === language
                                                return (
                                                    <button
                                                        key={language}
                                                        type="button"
                                                        role="tab"
                                                        aria-selected={active}
                                                        className={cn(
                                                            "h-8 rounded px-2.5 text-xs font-medium transition-colors",
                                                            active
                                                                ? "bg-primary text-primary-foreground"
                                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                        )}
                                                        onClick={() => setSolutionGuideLanguage(language)}
                                                    >
                                                        {details.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="practice-markdown rounded-lg bg-background/60 p-4">
                                            {renderedSolutionGuides?.[solutionGuideLanguage]
                                                ?? <div className="whitespace-pre-wrap">{solutionGuideDetails?.solutionGuide ?? ""}</div>}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="followups" className="px-4">
                                <AccordionTrigger>Follow-up Guide</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-4">
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {problem.followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}
                                        </ul>
                                        {problem.followUpGuide && (
                                            <div className="practice-markdown rounded-lg bg-background/60 p-4">
                                                {renderedFollowUpGuide ?? <div className="whitespace-pre-wrap">{problem.followUpGuide}</div>}
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </section>}

                <button
                    type="button"
                    aria-label="Resize problem panel"
                    title="Resize problem panel"
                    className={cn(
                        "hidden cursor-col-resize touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex",
                        !problemPaneVisible && "lg:hidden"
                    )}
                    onPointerDown={startProblemPaneResize}
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <section ref={editorColumnRef} className="flex min-w-0 flex-col md:min-h-[calc(100vh-12rem)] lg:min-h-0">
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border/50 bg-card/50">
                        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-3">
                            <div className="inline-flex items-center gap-2 text-sm font-medium">
                                <Code2 className="h-4 w-4 text-primary" />
                                Editor
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex rounded-md border border-border/60 bg-background p-0.5">
                                    {availableLanguages.map((language) => (
                                        <button
                                            key={language}
                                            type="button"
                                            className={cn(
                                                "h-8 rounded px-2.5 text-xs font-medium transition-colors",
                                                selectedLanguage === language
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                            onClick={() => switchLanguage(language)}
                                        >
                                            {PRACTICE_LANGUAGES[language].label}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-muted-foreground"
                                    onClick={() => {
                                        setCode(selectedLanguageDetails?.starterCode ?? problem.starterCode)
                                        setResult(null)
                                        setError(null)
                                    }}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    disabled={Boolean(runningMode)}
                                    onClick={() => run("run")}
                                >
                                    {runningMode === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    Run
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="gap-2"
                                    disabled={Boolean(runningMode)}
                                    onClick={() => run("submit")}
                                >
                                    {runningMode === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Submit
                                </Button>
                            </div>
                        </div>
                        <div className={cn("min-h-[55vh] flex-1 overflow-hidden bg-background md:min-h-0", !customTestPaneVisible && "rounded-b-lg")}>
                            <PracticeCodeEditor
                                value={code}
                                onChange={setCode}
                                language={selectedLanguage}
                                label={editorLabel}
                                isLightTheme={isLightTheme}
                            />
                        </div>
                        {customTestPaneVisible && <div className="shrink-0 border-t border-border/50 bg-background/70 p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <TestTube2 className="h-3.5 w-3.5" />
                                    Custom Test
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-muted-foreground"
                                    aria-label="Hide custom test panel"
                                    title="Hide custom test panel"
                                    onClick={hideCustomTestPane}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="h-24 overflow-hidden rounded-md border border-border/60 bg-card/70 md:h-28">
                                <PracticeCodeEditor
                                    value={customTestCode}
                                    onChange={setCustomTestCode}
                                    language={selectedLanguage}
                                    label={customTestLabel}
                                    isLightTheme={isLightTheme}
                                />
                            </div>
                            <div className="mt-2 flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 px-2 text-xs"
                                    disabled={Boolean(runningMode)}
                                    onClick={() => run("run", customTestCode)}
                                >
                                    {runningMode === "run" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                                    Run Custom
                                </Button>
                            </div>
                        </div>}
                    </div>

                    {resultsPaneVisible && (
                        <button
                            type="button"
                            aria-label="Resize results panel"
                            title="Resize results panel"
                            className="my-2 hidden h-4 cursor-row-resize touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
                            onPointerDown={startResultsPaneResize}
                        >
                            <GripHorizontal className="h-4 w-4" />
                        </button>
                    )}

                    {resultsPaneVisible && (
                        <div className="mt-4 min-h-[16rem] shrink-0 lg:mt-0 lg:h-[var(--results-pane-height)] lg:min-h-0">
                            <ResultsPanel result={result} error={error} runningMode={runningMode} onClose={() => setResultsPaneVisible(false)} />
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

function ResultsPanel({
    result,
    error,
    runningMode,
    onClose,
}: {
    result: PracticeRunResult | null
    error: string | null
    runningMode: PracticeRunMode | null
    onClose: () => void
}) {
    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border/50 bg-card/50">
            <div className="shrink-0 flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div className="text-sm font-medium">Results</div>
                <div className="flex items-center gap-2">
                    {result && (
                        <Badge variant="outline" className={cn(
                            "gap-1.5",
                            result.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                        )}>
                            {result.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {result.passed}/{result.total} passed
                        </Badge>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        aria-label="Hide results panel"
                        title="Hide results panel"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {runningMode && (
                    <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {runningMode === "run" ? "Running sample tests" : "Submitting all tests"}
                    </div>
                )}
                {!runningMode && error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
                )}
                {!runningMode && !error && !result && (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Run sample tests or submit all tests.</div>
                )}
                {!runningMode && result && (
                    <div className="space-y-4">
                        <div className={cn(
                            "sticky top-0 z-10 flex items-center justify-between gap-3 rounded-lg border p-3 shadow-sm backdrop-blur",
                            result.ok
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                                : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
                        )}>
                            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                                {result.ok ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                                <span>{result.ok ? "All tests passed" : "Tests failing"}</span>
                            </div>
                            <div className="shrink-0 text-lg font-bold leading-none">{result.passed}/{result.total} passed</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Stat label="Runtime" value={`${Math.round(result.runtimeMs)} ms`} icon={<Clock3 className="h-3.5 w-3.5" />} />
                            <Stat label="Memory" value={`${Math.round(result.memoryKb / 1024)} MB`} icon={<MemoryStick className="h-3.5 w-3.5" />} />
                            <Stat label="Mode" value={result.mode === "run" ? "Run" : "Submit"} />
                        </div>
                        <div className="space-y-2">
                            {result.results.map((caseResult) => (
                                <div key={`${caseResult.name}-${caseResult.visibility}`} className="rounded-lg border border-border/40 bg-background/60 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            {caseResult.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                                            {caseResult.name}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{caseResult.durationMs} ms</span>
                                    </div>
                                    {(caseResult.input || caseResult.expected || caseResult.description) && (
                                        <CaseContextBlock
                                            description={caseResult.description}
                                            input={caseResult.input}
                                            expected={caseResult.expected}
                                        />
                                    )}
                                    {!caseResult.passed && caseResult.assertion && (
                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                            <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                                                    Expected
                                                </div>
                                                <code className="mt-1 block max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-emerald-900 dark:text-emerald-50">
                                                    {caseResult.assertion.expected}
                                                </code>
                                            </div>
                                            <div className="rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2">
                                                <div className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-200">
                                                    Returned
                                                </div>
                                                <code className="mt-1 block max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-red-900 dark:text-red-50">
                                                    {caseResult.assertion.actual}
                                                </code>
                                            </div>
                                        </div>
                                    )}
                                    {!caseResult.passed && caseResult.errorLine && (
                                        <div className="mt-3 rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                            <div className="font-medium">
                                                Evaluated check{caseResult.errorLineNumber ? ` ${caseResult.errorLineNumber}` : ""}
                                            </div>
                                            <code className="mt-1 block whitespace-pre-wrap break-words font-mono">{caseResult.errorLine}</code>
                                        </div>
                                    )}
                                    {caseResult.stdout && <CaseOutputBlock label="Stdout" value={caseResult.stdout} />}
                                    {caseResult.stderr && <CaseOutputBlock label="Stderr" value={caseResult.stderr} tone={caseResult.passed ? "muted" : "error"} />}
                                    {caseResult.feedback && <CaseOutputBlock label="Feedback" value={caseResult.feedback} tone={caseResult.passed ? "muted" : "error"} />}
                                    {caseResult.error && <CaseOutputBlock label={caseResult.passed ? "Detail" : "Traceback"} value={caseResult.error} tone="error" />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function CaseContextBlock({
    description,
    input,
    expected,
}: {
    description?: string
    input?: string
    expected?: string
}) {
    return (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
            {description && (
                <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 md:col-span-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Case</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                </div>
            )}
            {input && (
                <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Input</div>
                    <code className="mt-1 block max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-foreground">{input}</code>
                </div>
            )}
            {expected && (
                <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expected</div>
                    <code className="mt-1 block max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-foreground">{expected}</code>
                </div>
            )}
        </div>
    )
}

function StructuredTestCaseBlock({
    setup,
    checks,
    caseInput,
    caseExpected,
    language,
    isLightTheme,
}: {
    setup?: string
    checks: PracticeTestCheck[]
    caseInput?: string
    caseExpected?: string
    language: PracticeLanguage
    isLightTheme: boolean
}) {
    return (
        <div className="divide-y divide-border/40">
            {setup && (
                <div>
                    <div className="border-b border-border/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Setup
                    </div>
                    <TestCaseCodeBlock code={setup} language={language} isLightTheme={isLightTheme} />
                </div>
            )}
            <div className="grid gap-2 p-3">
                {checks.map((check, index) => {
                    const displayInput = checks.length === 1 && caseInput ? caseInput : check.input
                    const displayExpected = checks.length === 1 && caseExpected ? caseExpected : check.expected
                    return (
                        <div key={`${check.input}-${index}`} className="grid gap-2 rounded-md border border-border/40 bg-muted/20 p-3">
                            <div className="grid gap-2 md:grid-cols-2">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Input</div>
                                    <code className="mt-1 block whitespace-pre-wrap break-words rounded border border-border/40 bg-background/70 px-2 py-1.5 font-mono text-xs text-foreground">
                                        {displayInput}
                                    </code>
                                </div>
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expected</div>
                                    <code className="mt-1 block whitespace-pre-wrap break-words rounded border border-border/40 bg-background/70 px-2 py-1.5 font-mono text-xs text-foreground">
                                        {displayExpected}
                                    </code>
                                </div>
                            </div>
                            {(check.before || check.expression !== displayInput || check.operator !== "==") && (
                                <div className="grid gap-2 md:grid-cols-2">
                                    {check.before && (
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Before</div>
                                            <code className="mt-1 block whitespace-pre-wrap break-words rounded border border-border/40 bg-background/70 px-2 py-1.5 font-mono text-xs text-muted-foreground">
                                                {check.before}
                                            </code>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            {check.operator === "==" ? "Evaluates" : `Evaluates ${check.operator}`}
                                        </div>
                                        <code className="mt-1 block whitespace-pre-wrap break-words rounded border border-border/40 bg-background/70 px-2 py-1.5 font-mono text-xs text-muted-foreground">
                                            {check.expression}
                                        </code>
                                    </div>
                                </div>
                            )}
                            {check.feedback && <p className="text-xs leading-5 text-muted-foreground">{check.feedback}</p>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function TestCaseCodeBlock({
    code,
    language,
    isLightTheme,
}: {
    code: string
    language: PracticeLanguage
    isLightTheme: boolean
}) {
    const lineNumberStyle: SyntaxHighlighterProps["lineNumberStyle"] = {
        minWidth: "2.25em",
        paddingRight: "0.75em",
        color: isLightTheme ? "rgba(15, 23, 42, 0.28)" : "rgba(255, 255, 255, 0.24)",
        userSelect: "none",
        fontSize: "0.75rem",
    }

    return (
        <SyntaxHighlighter
            style={isLightTheme ? oneLight : oneDark}
            language={language === "java" ? "java" : "python"}
            PreTag="div"
            showLineNumbers
            lineNumberStyle={lineNumberStyle}
            customStyle={{
                margin: 0,
                maxHeight: "16rem",
                overflow: "auto",
                padding: "0.875rem",
                borderRadius: 0,
                background: "transparent",
                fontSize: "0.78rem",
                lineHeight: "1.55",
            }}
            codeTagProps={{
                style: {
                    background: "transparent",
                    fontFamily: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                },
            }}
        >
            {code}
        </SyntaxHighlighter>
    )
}

function CaseOutputBlock({
    label,
    value,
    tone = "muted",
}: {
    label: string
    value: string
    tone?: "muted" | "error"
}) {
    return (
        <div className={cn(
            "mt-3 overflow-hidden rounded-md border text-xs",
            tone === "error"
                ? "border-red-500/20 bg-red-950/30 text-red-100"
                : "border-border/40 bg-muted/40 text-muted-foreground"
        )}>
            <div className={cn(
                "border-b px-3 py-1.5 font-semibold uppercase tracking-wide",
                tone === "error" ? "border-red-500/20 text-red-200" : "border-border/40"
            )}>
                {label}
            </div>
            <pre className="max-h-44 overflow-auto p-3 leading-5">
                <code>{value}</code>
            </pre>
        </div>
    )
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
    return (
        <div className="rounded-lg border border-border/40 bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-1 text-sm font-medium">{value}</div>
        </div>
    )
}
