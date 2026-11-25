export type CodeSegment =
    | {
        kind: "visible"
        id: string
        startLine: number
        endLine: number
        lines: string[]
        highlightedLines?: Set<number>
    }
    | {
        kind: "folded"
        id: string
        startLine: number
        endLine: number
        lines: string[]
        label: string
        edge: "top" | "middle" | "bottom"
    }

export type CodeFoldPlan = {
    /** Clean complete runnable code (with fold marker comment lines stripped) for Copy and full view. */
    cleanCode: string
    /** Total line count of cleanCode. */
    totalLines: number
    /** Ordered visible and folded segments. */
    segments: CodeSegment[]
    /** Whether at least one segment is folded by default. */
    hasFolds: boolean
    /** Number of hidden lines when all folds are collapsed. */
    hiddenLineCount: number
    /** True when explicit focus ranges were provided. */
    hasFocusHighlights: boolean
}

const FOLD_START_RE = /^\s*(?:#|\/\/)\s*fold:start(?:\s+(.*))?$/i
const FOLD_END_RE = /^\s*(?:#|\/\/)\s*fold:end\s*$/i

const PYTHON_LANGUAGES = new Set(["python", "py", "python3"])
const AUTO_FOLD_MIN_LINES = 18
const MIN_VISIBLE_CORE_LINES = 6

export function parseFocusRanges(raw: string | undefined, maxLine: number): Set<number> {
    const result = new Set<number>()
    if (!raw) return result

    for (const part of raw.split(",")) {
        const trimmed = part.trim()
        if (!trimmed) continue
        const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/)
        if (range) {
            const start = Math.max(1, Number.parseInt(range[1], 10))
            const end = Math.min(maxLine, Number.parseInt(range[2], 10))
            for (let line = start; line <= end; line += 1) {
                result.add(line)
            }
            continue
        }
        const single = trimmed.match(/^(\d+)$/)
        if (single) {
            const line = Number.parseInt(single[1], 10)
            if (line >= 1 && line <= maxLine) {
                result.add(line)
            }
        }
    }

    return result
}

type RawFoldRange = {
    startIndex: number
    endIndex: number
    label: string
}

function extractExplicitFolds(rawLines: string[]): {
    cleanLines: string[]
    folds: RawFoldRange[]
} {
    const cleanLines: string[] = []
    const folds: RawFoldRange[] = []
    let activeFold: { startIndex: number; label: string } | null = null

    for (const line of rawLines) {
        const startMatch = line.match(FOLD_START_RE)
        if (startMatch && !activeFold) {
            activeFold = {
                startIndex: cleanLines.length,
                label: startMatch[1]?.trim() || "setup & scaffolding",
            }
            continue
        }
        if (FOLD_END_RE.test(line) && activeFold) {
            const endIndex = cleanLines.length - 1
            if (endIndex >= activeFold.startIndex) {
                folds.push({
                    startIndex: activeFold.startIndex,
                    endIndex,
                    label: activeFold.label,
                })
            }
            activeFold = null
            continue
        }
        cleanLines.push(line)
    }

    if (activeFold) {
        const endIndex = cleanLines.length - 1
        if (endIndex >= activeFold.startIndex) {
            folds.push({
                startIndex: activeFold.startIndex,
                endIndex,
                label: activeFold.label,
            })
        }
    }

    return { cleanLines, folds }
}

function isPythonImportOrSeedLine(line: string): boolean {
    const t = line.trim()
    if (!t || t.startsWith("#")) return true
    if (/^(?:import|from)\s+/.test(t)) return true
    if (/^(?:random\.seed|np\.random\.seed|torch\.manual_seed|rng\s*=\s*np\.random\.default_rng)\s*\(/.test(t)) return true
    return false
}

const PYTHON_IMPORT_RE = /^(?:import\s+\S|from\s+\S+\s+import\s+)/

/**
 * Extract normalized top-level leading Python import statements from a code block
 * (ignoring blank lines, comments, and `# fold:start/end` markers).
 */
export function extractLeadingPythonImports(rawCode: string): string[] {
    const imports: string[] = []
    const lines = rawCode.replace(/\r\n/g, "\n").split("\n")
    let buf = ""
    let inMultiline = false

    for (const raw of lines) {
        if (FOLD_START_RE.test(raw) || FOLD_END_RE.test(raw)) continue
        const t = raw.trim()
        if (inMultiline) {
            buf += " " + t
            if (t.includes(")")) {
                imports.push(buf.replace(/\s+/g, " ").trim())
                buf = ""
                inMultiline = false
            }
            continue
        }
        if (!t || t.startsWith("#")) continue
        if (PYTHON_IMPORT_RE.test(t)) {
            if (t.includes("(") && !t.includes(")")) {
                buf = t
                inMultiline = true
            } else {
                imports.push(t.replace(/\s+/g, " "))
            }
            continue
        }
        break
    }
    return imports
}

/**
 * Find the end index (inclusive) of leading import lines that were ALL already
 * imported earlier in the same article. Returns -1 when no leading imports are repeated.
 */
function detectRepeatedLeadingPythonImportsEnd(
    cleanLines: string[],
    priorImports: ReadonlySet<string>,
): number {
    if (priorImports.size === 0) return -1
    let lastRepeatedEnd = -1
    let repeatedCount = 0
    let i = 0

    while (i < cleanLines.length) {
        const t = cleanLines[i].trim()
        if (!t) {
            i += 1
            continue
        }
        if (!PYTHON_IMPORT_RE.test(t)) break

        let stmt = t
        let stmtEnd = i
        if (t.includes("(") && !t.includes(")")) {
            while (stmtEnd + 1 < cleanLines.length) {
                stmtEnd += 1
                stmt += " " + cleanLines[stmtEnd].trim()
                if (cleanLines[stmtEnd].includes(")")) break
            }
        }
        const normalized = stmt.replace(/\s+/g, " ").trim()
        if (!priorImports.has(normalized)) break

        lastRepeatedEnd = stmtEnd
        repeatedCount += 1
        i = stmtEnd + 1
    }

    if (repeatedCount === 0) return -1
    // Include trailing blank line right after the repeated imports so visible code starts flush.
    while (lastRepeatedEnd + 1 < cleanLines.length && !cleanLines[lastRepeatedEnd + 1].trim()) {
        lastRepeatedEnd += 1
    }
    return lastRepeatedEnd
}

const TRAILING_HARNESS_LABEL_RE = /\b(?:print|prints|harness|assert|assertions|check|checks|test|tests|driver|demo|scenarios|output|verification|summary)\b/i
const IMPORT_ONLY_LABEL_RE = /^imports?$/i

/**
 * Prepare a code listing for print: collapse `# fold:start` / `# fold:end` scaffolding
 * cleanly (omitting pure trailing print/test harnesses and already-imported-only preambles)
 * and strip leading Python imports that were already shown earlier in the same chapter.
 */
export function prepareCodeForPrint(
    rawCode: string,
    language: string,
    priorPythonImports?: ReadonlySet<string>,
): { code: string; imports: string[] } {
    const isPython = PYTHON_LANGUAGES.has(language.toLowerCase())
    const imports = isPython ? extractLeadingPythonImports(rawCode) : []
    const lines = rawCode.replace(/\r\n/g, "\n").split("\n")

    type Block =
        | { kind: "visible"; lines: string[] }
        | { kind: "folded"; indent: string; prefix: string; label: string; lines: string[] }

    const blocks: Block[] = []
    let currentVisible: string[] = []
    let activeFold: { indent: string; prefix: string; label: string; lines: string[]; depth: number } | null = null

    const flushVisible = () => {
        if (currentVisible.length > 0) {
            blocks.push({ kind: "visible", lines: currentVisible })
            currentVisible = []
        }
    }

    for (const line of lines) {
        const startMatch = /^(\s*)(#|\/\/)\s*fold:start(?:\s+(.*))?$/i.exec(line)
        if (startMatch) {
            if (!activeFold) {
                flushVisible()
                activeFold = {
                    indent: startMatch[1],
                    prefix: startMatch[2],
                    label: (startMatch[3] ?? "").trim(),
                    lines: [],
                    depth: 1,
                }
            } else {
                activeFold.depth += 1
            }
            continue
        }
        if (FOLD_END_RE.test(line)) {
            if (activeFold) {
                activeFold.depth -= 1
                if (activeFold.depth === 0) {
                    blocks.push({
                        kind: "folded",
                        indent: activeFold.indent,
                        prefix: activeFold.prefix,
                        label: activeFold.label,
                        lines: activeFold.lines,
                    })
                    activeFold = null
                }
            }
            continue
        }
        if (activeFold) activeFold.lines.push(line)
        else currentVisible.push(line)
    }
    flushVisible()
    if (activeFold) {
        blocks.push({
            kind: "folded",
            indent: activeFold.indent,
            prefix: activeFold.prefix,
            label: activeFold.label,
            lines: activeFold.lines,
        })
    }

    const out: string[] = []
    for (let idx = 0; idx < blocks.length; idx += 1) {
        const block = blocks[idx]
        const isFirst = idx === 0
        const isLast = idx === blocks.length - 1
        if (block.kind === "folded") {
            // Drop trailing test/print/assert harnesses completely in print.
            if (isLast && TRAILING_HARNESS_LABEL_RE.test(block.label)) continue
            // Drop leading import-only folds when every import was already shown earlier.
            if (isFirst && isPython && priorPythonImports && priorPythonImports.size > 0) {
                const nonEmpty = block.lines.filter((l) => l.trim() && !l.trim().startsWith("#"))
                const onlyRepeatedImports =
                    nonEmpty.length > 0 &&
                    nonEmpty.every((l) => PYTHON_IMPORT_RE.test(l.trim()) && priorPythonImports.has(l.trim().replace(/\s+/g, " ")))
                if (onlyRepeatedImports || IMPORT_ONLY_LABEL_RE.test(block.label)) continue
            }
            out.push(`${block.indent}${block.prefix} ... ${block.label || "setup omitted"}`)
        } else {
            let visibleLines = block.lines
            if (isFirst && isPython && priorPythonImports && priorPythonImports.size > 0) {
                const repeatedEnd = detectRepeatedLeadingPythonImportsEnd(visibleLines, priorPythonImports)
                if (repeatedEnd >= 0 && visibleLines.length - (repeatedEnd + 1) >= 1) {
                    visibleLines = visibleLines.slice(repeatedEnd + 1)
                }
            }
            out.push(...visibleLines)
        }
    }

    // Trim leading and trailing blank lines so listings never print empty dangling line numbers.
    while (out.length > 0 && !out[0].trim()) out.shift()
    while (out.length > 0 && !out[out.length - 1].trim()) out.pop()

    return { code: out.join("\n"), imports }
}

function detectPythonLeadingSetupEnd(lines: string[]): number {
    // Only consider leading import/seed preamble; stop cleanly at the first non-import statement.
    let lastBoilerplateIdx = -1
    let nonEmptyBoilerplate = 0
    let inMultilineImport = false

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i]
        const t = line.trim()

        if (inMultilineImport) {
            lastBoilerplateIdx = i
            nonEmptyBoilerplate += 1
            if (t.includes(")")) {
                inMultilineImport = false
            }
            continue
        }

        if (!t) {
            continue
        }

        if (isPythonImportOrSeedLine(line)) {
            if (/^(?:import|from)\s+/.test(t) && t.includes("(") && !t.includes(")")) {
                inMultilineImport = true
            }
            if (!t.startsWith("#")) {
                lastBoilerplateIdx = i
                nonEmptyBoilerplate += 1
            } else if (lastBoilerplateIdx >= 0) {
                lastBoilerplateIdx = i
            }
            continue
        }

        break
    }

    // Require at least 3 meaningful import/seed lines so tiny 1-2 line imports stay visible.
    if (nonEmptyBoilerplate < 3 || lastBoilerplateIdx < 2) {
        return -1
    }

    // Include a trailing blank line cleanly inside the folded hunk if present.
    let endIdx = lastBoilerplateIdx
    while (endIdx + 1 < lines.length && lines[endIdx + 1].trim() === "") {
        endIdx += 1
    }
    return endIdx
}

function detectPythonTrailingDriverStart(lines: string[], minStartIndex: number): number {
    const n = lines.length

    // 1. Explicit `if __name__ == "__main__":` block at the tail.
    for (let i = minStartIndex; i < n; i += 1) {
        if (/^if\s+__name__\s*==\s*["']__main__["']\s*:/.test(lines[i].trim())) {
            let start = i
            while (start > minStartIndex && lines[start - 1].trim() === "") {
                start -= 1
            }
            if (n - start >= 4) {
                return start
            }
            break
        }
    }

    // 2. Trailing assertion / print driver lines after the last top-level def/class.
    let lastDefOrClassIdx = -1
    for (let i = 0; i < n; i += 1) {
        if (/^(?:async\s+)?(?:def|class)\s+/.test(lines[i])) {
            lastDefOrClassIdx = i
        }
    }
    if (lastDefOrClassIdx === -1) {
        return -1
    }

    // Find end of that last top-level def/class body.
    let bodyEnd = lastDefOrClassIdx
    for (let i = lastDefOrClassIdx + 1; i < n; i += 1) {
        const line = lines[i]
        if (line.trim() === "" || /^\s+/.test(line)) {
            if (line.trim() !== "") bodyEnd = i
        } else {
            break
        }
    }

    // Scan from the tail upward over top-level print/assert/comment/blank lines after bodyEnd.
    let tailStart = n
    let meaningfulTailLines = 0
    for (let i = n - 1; i > bodyEnd; i -= 1) {
        const line = lines[i]
        const t = line.trim()
        if (!t) {
            tailStart = i
            continue
        }
        const isTopLevelDriver =
            !line.startsWith(" ") &&
            !line.startsWith("\t") &&
            (t.startsWith("print(") || t.startsWith("assert ") || t.startsWith("#"))
        const isIndentedContinuation =
            (line.startsWith(" ") || line.startsWith("\t")) && tailStart < n
        if (isTopLevelDriver || isIndentedContinuation) {
            tailStart = i
            if (!t.startsWith("#")) meaningfulTailLines += 1
        } else {
            break
        }
    }

    if (meaningfulTailLines >= 4 && tailStart >= minStartIndex) {
        return tailStart
    }

    return -1
}

function buildSegmentsFromFolds(
    lines: string[],
    folds: RawFoldRange[],
    highlightedLines?: Set<number>,
): CodeSegment[] {
    const sorted = [...folds]
        .filter((f) => f.startIndex <= f.endIndex && f.startIndex >= 0 && f.endIndex < lines.length)
        .sort((a, b) => a.startIndex - b.startIndex)

    // Merge overlapping fold ranges safely.
    const merged: RawFoldRange[] = []
    for (const fold of sorted) {
        const prev = merged.at(-1)
        if (prev && fold.startIndex <= prev.endIndex + 1) {
            prev.endIndex = Math.max(prev.endIndex, fold.endIndex)
            if (prev.label !== fold.label) {
                prev.label = `${prev.label}, ${fold.label}`
            }
        } else {
            merged.push({ ...fold })
        }
    }

    const segments: CodeSegment[] = []
    let cursor = 0

    for (let idx = 0; idx < merged.length; idx += 1) {
        const fold = merged[idx]
        if (cursor < fold.startIndex) {
            const slice = lines.slice(cursor, fold.startIndex)
            segments.push({
                kind: "visible",
                id: `visible-${cursor + 1}-${fold.startIndex}`,
                startLine: cursor + 1,
                endLine: fold.startIndex,
                lines: slice,
                highlightedLines,
            })
        }

        const edge: "top" | "middle" | "bottom" =
            fold.startIndex === 0
                ? "top"
                : fold.endIndex === lines.length - 1
                    ? "bottom"
                    : "middle"

        segments.push({
            kind: "folded",
            id: `fold-${fold.startIndex + 1}-${fold.endIndex + 1}`,
            startLine: fold.startIndex + 1,
            endLine: fold.endIndex + 1,
            lines: lines.slice(fold.startIndex, fold.endIndex + 1),
            label: fold.label,
            edge,
        })
        cursor = fold.endIndex + 1
    }

    if (cursor < lines.length) {
        segments.push({
            kind: "visible",
            id: `visible-${cursor + 1}-${lines.length}`,
            startLine: cursor + 1,
            endLine: lines.length,
            lines: lines.slice(cursor),
            highlightedLines,
        })
    }

    return segments
}

export function buildCodeFoldPlan(
    rawCode: string,
    options: {
        language?: string
        focus?: string
        noFold?: boolean
        output?: boolean
        compact?: boolean
        bare?: boolean
        priorImports?: readonly string[]
    } = {},
): CodeFoldPlan {
    const rawLines = rawCode.split("\n")
    const { cleanLines, folds: explicitFolds } = extractExplicitFolds(rawLines)
    const cleanCode = cleanLines.join("\n")
    const totalLines = cleanLines.length

    if (options.noFold || options.output || options.bare || totalLines === 0) {
        return {
            cleanCode,
            totalLines,
            segments: [
                {
                    kind: "visible",
                    id: `visible-1-${totalLines}`,
                    startLine: 1,
                    endLine: totalLines,
                    lines: cleanLines,
                },
            ],
            hasFolds: false,
            hiddenLineCount: 0,
            hasFocusHighlights: false,
        }
    }

    // 1. Explicit focus ranges (e.g. focus="12-26,32-38") take highest precedence.
    const focusSet = parseFocusRanges(options.focus, totalLines)
    if (focusSet.size > 0) {
        const folds: RawFoldRange[] = []
        let hiddenStart = -1

        for (let i = 0; i < totalLines; i += 1) {
            const lineNumber = i + 1
            const isVisible = focusSet.has(lineNumber)
            if (!isVisible && hiddenStart === -1) {
                hiddenStart = i
            } else if (isVisible && hiddenStart !== -1) {
                const count = i - hiddenStart
                // Only collapse ranges of >= 2 lines; single context lines stay visible.
                if (count >= 2) {
                    folds.push({
                        startIndex: hiddenStart,
                        endIndex: i - 1,
                        label: hiddenStart === 0 ? "context above" : "context",
                    })
                }
                hiddenStart = -1
            }
        }
        if (hiddenStart !== -1 && totalLines - hiddenStart >= 2) {
            folds.push({
                startIndex: hiddenStart,
                endIndex: totalLines - 1,
                label: "context below",
            })
        }

        const segments = buildSegmentsFromFolds(cleanLines, folds, focusSet)
        const hiddenLineCount = segments
            .filter((s) => s.kind === "folded")
            .reduce((sum, s) => sum + s.lines.length, 0)

        return {
            cleanCode,
            totalLines,
            segments,
            hasFolds: hiddenLineCount > 0,
            hiddenLineCount,
            hasFocusHighlights: true,
        }
    }

    // 2. Explicit `# fold:start` / `# fold:end` regions.
    if (explicitFolds.length > 0) {
        const segments = buildSegmentsFromFolds(cleanLines, explicitFolds)
        const hiddenLineCount = segments
            .filter((s) => s.kind === "folded")
            .reduce((sum, s) => sum + s.lines.length, 0)
        return {
            cleanCode,
            totalLines,
            segments,
            hasFolds: hiddenLineCount > 0,
            hiddenLineCount,
            hasFocusHighlights: false,
        }
    }

    // 3. Smart automatic folding for Python blocks (repeated leading imports on any block >= 3 lines,
    // plus full setup/driver auto-folding for longer blocks >= 18 lines).
    const lang = options.language?.toLowerCase() ?? ""
    if (PYTHON_LANGUAGES.has(lang) && !options.compact) {
        const autoFolds: RawFoldRange[] = []
        const priorSet = options.priorImports?.length ? new Set(options.priorImports) : undefined

        if (totalLines >= AUTO_FOLD_MIN_LINES) {
            const topEnd = detectPythonLeadingSetupEnd(cleanLines)
            const coreStart = topEnd >= 0 ? topEnd + 1 : 0
            const bottomStart = detectPythonTrailingDriverStart(cleanLines, coreStart + MIN_VISIBLE_CORE_LINES)

            if (topEnd >= 0 && totalLines - (topEnd + 1) >= MIN_VISIBLE_CORE_LINES) {
                autoFolds.push({
                    startIndex: 0,
                    endIndex: topEnd,
                    label: "imports & setup",
                })
            }

            if (bottomStart >= 0) {
                const visibleAfterBoth =
                    totalLines -
                    (autoFolds[0] ? autoFolds[0].endIndex + 1 : 0) -
                    (totalLines - bottomStart)
                if (visibleAfterBoth >= MIN_VISIBLE_CORE_LINES) {
                    autoFolds.push({
                        startIndex: bottomStart,
                        endIndex: totalLines - 1,
                        label: "example run & checks",
                    })
                }
            }
        }

        // Even on compact/medium Python snippets, fold leading imports already shown earlier in this lesson.
        if (autoFolds.length === 0 && priorSet) {
            const repeatedEnd = detectRepeatedLeadingPythonImportsEnd(cleanLines, priorSet)
            if (repeatedEnd >= 0 && totalLines - (repeatedEnd + 1) >= 2) {
                autoFolds.push({
                    startIndex: 0,
                    endIndex: repeatedEnd,
                    label: "repeated imports",
                })
            }
        }

        if (autoFolds.length > 0) {
            const segments = buildSegmentsFromFolds(cleanLines, autoFolds)
            const hiddenLineCount = segments
                .filter((s) => s.kind === "folded")
                .reduce((sum, s) => sum + s.lines.length, 0)
            return {
                cleanCode,
                totalLines,
                segments,
                hasFolds: hiddenLineCount > 0,
                hiddenLineCount,
                hasFocusHighlights: false,
            }
        }
    }

    return {
        cleanCode,
        totalLines,
        segments: [
            {
                kind: "visible",
                id: `visible-1-${totalLines}`,
                startLine: 1,
                endLine: totalLines,
                lines: cleanLines,
            },
        ],
        hasFolds: false,
        hiddenLineCount: 0,
        hasFocusHighlights: false,
    }
}
