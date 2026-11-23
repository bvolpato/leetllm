import type { PracticeDifficulty, PracticeListItem } from "@/lib/practice"

export type PracticeStatusFilter = "All" | "Open" | "Learned"
export type PracticeSortKey = "roadmap" | "title" | "difficulty" | "category" | "tests" | "time" | "status"
export type PracticeSortDirection = "asc" | "desc"

export interface PracticeListState {
    query: string
    difficulty: PracticeDifficulty | "All"
    category: string
    status: PracticeStatusFilter
    sort: PracticeSortKey
    direction: PracticeSortDirection
}

type SearchParamReader = Pick<URLSearchParams, "get">

const difficulties: Array<PracticeDifficulty | "All"> = ["All", "Easy", "Medium", "Hard"]
const statuses: PracticeStatusFilter[] = ["All", "Open", "Learned"]
const sortKeys: PracticeSortKey[] = ["roadmap", "title", "difficulty", "category", "tests", "time", "status"]

const difficultyRank: Record<PracticeDifficulty, number> = {
    Easy: 0,
    Medium: 1,
    Hard: 2,
}

const defaultDirectionBySort: Record<PracticeSortKey, PracticeSortDirection> = {
    roadmap: "asc",
    title: "asc",
    difficulty: "asc",
    category: "asc",
    tests: "desc",
    time: "asc",
    status: "asc",
}

export const defaultPracticeListState: PracticeListState = {
    query: "",
    difficulty: "All",
    category: "All",
    status: "All",
    sort: "roadmap",
    direction: "asc",
}

export function parsePracticeListState(searchParams: SearchParamReader, categories: string[] = []): PracticeListState {
    const difficulty = searchParams.get("difficulty")
    const status = searchParams.get("status")
    const sort = searchParams.get("sort")
    const direction = searchParams.get("dir")
    const category = searchParams.get("category") ?? defaultPracticeListState.category
    const categorySet = new Set(categories)
    const selectedSort = sortKeys.includes(sort as PracticeSortKey)
        ? sort as PracticeSortKey
        : defaultPracticeListState.sort

    return {
        query: searchParams.get("q") ?? defaultPracticeListState.query,
        difficulty: difficulties.includes(difficulty as PracticeDifficulty | "All")
            ? difficulty as PracticeDifficulty | "All"
            : defaultPracticeListState.difficulty,
        category: categorySet.size === 0 || category === "All" || categorySet.has(category)
            ? category
            : defaultPracticeListState.category,
        status: statuses.includes(status as PracticeStatusFilter)
            ? status as PracticeStatusFilter
            : defaultPracticeListState.status,
        sort: selectedSort,
        direction: direction === "asc" || direction === "desc"
            ? direction
            : defaultDirectionBySort[selectedSort],
    }
}

export function practiceListQueryString(state: PracticeListState): string {
    const params = new URLSearchParams()
    if (state.query.trim()) params.set("q", state.query.trim())
    if (state.difficulty !== defaultPracticeListState.difficulty) params.set("difficulty", state.difficulty)
    if (state.category !== defaultPracticeListState.category) params.set("category", state.category)
    if (state.status !== defaultPracticeListState.status) params.set("status", state.status)
    if (state.sort !== defaultPracticeListState.sort) params.set("sort", state.sort)
    if (state.direction !== defaultDirectionBySort[state.sort]) params.set("dir", state.direction)

    const query = params.toString()
    return query ? `?${query}` : ""
}

export function practiceQueryStringToSearch(queryString: string): string {
    return queryString.startsWith("?") ? queryString.slice(1) : queryString
}

export function practiceListHref(state: PracticeListState): string {
    const params = new URLSearchParams(practiceListQueryString(state))
    params.set("mode", "coding")
    return `/practice?${params.toString()}`
}

export function practiceProblemHref(slug: string, state: PracticeListState): string {
    return `/practice/${slug}${practiceListQueryString(state)}`
}

export function nextPracticeSort(state: PracticeListState, sort: PracticeSortKey): Pick<PracticeListState, "sort" | "direction"> {
    if (state.sort !== sort) {
        return { sort, direction: defaultDirectionBySort[sort] }
    }
    return { sort, direction: state.direction === "asc" ? "desc" : "asc" }
}

export function filterAndSortPracticeProblems(
    problems: PracticeListItem[],
    state: PracticeListState,
    isLearned: (slug: string) => boolean = () => false
): PracticeListItem[] {
    const needle = state.query.trim().toLowerCase()
    const originalIndex = new Map(problems.map((problem, index) => [problem.slug, index]))
    const matches = problems.filter((problem) => {
        if (state.difficulty !== "All" && problem.difficulty !== state.difficulty) return false
        if (state.category !== "All" && problem.category !== state.category) return false
        if (state.status === "Learned" && !isLearned(problem.slug)) return false
        if (state.status === "Open" && isLearned(problem.slug)) return false
        if (!needle) return true

        const haystack = [
            problem.title,
            problem.summary,
            problem.category,
            problem.source,
            ...problem.tags,
        ].join(" ").toLowerCase()
        return haystack.includes(needle)
    })

    return [...matches].sort((left, right) => {
        const bySort = comparePracticeProblems(left, right, state.sort, originalIndex, isLearned)
        const directed = state.direction === "asc" ? bySort : -bySort
        if (directed !== 0) return directed
        return (originalIndex.get(left.slug) ?? 0) - (originalIndex.get(right.slug) ?? 0)
    })
}

function comparePracticeProblems(
    left: PracticeListItem,
    right: PracticeListItem,
    sort: PracticeSortKey,
    originalIndex: Map<string, number>,
    isLearned: (slug: string) => boolean
) {
    if (sort === "title") return left.title.localeCompare(right.title)
    if (sort === "difficulty") return difficultyRank[left.difficulty] - difficultyRank[right.difficulty]
    if (sort === "category") return left.category.localeCompare(right.category)
    if (sort === "tests") return testCount(left) - testCount(right)
    if (sort === "time") return left.timeEstimateMinutes - right.timeEstimateMinutes
    if (sort === "status") return Number(isLearned(left.slug)) - Number(isLearned(right.slug))
    return (originalIndex.get(left.slug) ?? 0) - (originalIndex.get(right.slug) ?? 0)
}

function testCount(problem: PracticeListItem) {
    return problem.sampleTestCount + problem.hiddenTestCount
}
