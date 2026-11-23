import { BadgePill, Column, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Ranking and Recommendation Systems. Five eligible documents are reranked for retry idempotency key. The runbook and SDK example move above irrelevant documents; illustrative NDCG@5 rises from 0.910 to 1.000.'

// The article's scored five-document corpus and relevance grades.
export const documents = [
    { id: 'api-guide', retrieval: 0.96, queryFit: 0.98, reliability: 0.88, grade: 3 },
    { id: 'blog-post', retrieval: 0.91, queryFit: 0.35, reliability: 0.97, grade: 0 },
    { id: 'legacy-changelog', retrieval: 0.90, queryFit: 0.15, reliability: 0.99, grade: 0 },
    { id: 'retry-runbook', retrieval: 0.84, queryFit: 0.92, reliability: 0.98, grade: 2 },
    { id: 'sdk-example', retrieval: 0.80, queryFit: 0.86, reliability: 0.96, grade: 2 },
]
export const rankScore = (doc: typeof documents[number]) => 2 * doc.queryFit + 0.6 * doc.reliability
export const dcg = (grades: number[]) => grades.reduce((sum, grade, index) => sum + (2 ** grade - 1) / Math.log2(index + 2), 0)
export const retrievalOrder = [...documents].sort((a, b) => b.retrieval - a.retrieval || a.id.localeCompare(b.id))
export const rankedOrder = [...documents].sort((a, b) => rankScore(b) - rankScore(a) || a.id.localeCompare(b.id))
const ideal = dcg(documents.map(doc => doc.grade).sort((a, b) => b - a))

export function create(theme: ThemeMode = 'dark') {
    const palette = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = { ...palette, primaryLight: theme === 'light' ? palette.primaryDark : palette.primaryLight }
    const label = (text: string, size = 25, color = c.textPrimary) => TextLabel({ c, text, fontSize: size, color })
    const table = (ranked: boolean) => {
        const docs = ranked ? rankedOrder : retrievalOrder
        return Column({ width: 492, gap: 8, children: [
            TextLabel({ c, text: ranked ? 'RERANKED' : 'RETRIEVED', fontSize: 28, fontWeight: 750, color: ranked ? c.primaryLight : c.textPrimary }),
            Row({ width: 492, gap: 12, children: [Column({ width: 280, align: 'start', children: [label('Document', 20)] }), Column({ width: 100, children: [label(ranked ? 'Score' : 'Retrieval', 20)] }), label('Grade', 20)] }),
            ...docs.map((doc, index) => Row({ width: 492, gap: 12, align: 'center', children: [
                Column({ width: 280, align: 'start', children: [label(`${index + 1}  ${doc.id}`, 24)] }),
                Column({ width: 100, children: [label(ranked ? rankScore(doc).toFixed(3) : doc.retrieval.toFixed(2), 24)] }),
                BadgePill({ c, text: String(doc.grade), width: 60, height: 36, fontSize: 24, tone: doc.grade > 0 ? 'cyan' : 'neutral' }),
            ] })),
            TextLabel({ c, text: `NDCG@5  ${(dcg(docs.map(doc => doc.grade)) / ideal).toFixed(3)}`, fontSize: 32, fontWeight: 700, color: ranked ? c.primaryLight : c.textPrimary }),
        ] })
    }
    return Scene({ c, background: c.bg, padding: 48, gap: 18, contentWidth: 1104, children: [
        TextLabel({ c, text: 'Ranking and Recommendation Systems', fontSize: 44, fontWeight: 750, color: c.textPrimary }),
        label('Query: retry idempotency key   ·   Same five eligible documents', 25),
        Row({ width: 1104, gap: 26, align: 'center', children: [table(false), FlowArrow({ c, direction: 'right', length: 68, tone: 'purple' }), table(true)] }),
        Row({ width: 1104, justify: 'space-between', children: [label('Five-document corpus · Grades are offline judgments', 24), TextLabel({ c, text: 'LeetLLM', fontSize: 27, fontWeight: 750, color: c.primaryLight })] }),
    ] })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner dimensions ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}
export default create('dark')
