import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 640
export const height = 640
export const alt =
    'Three LangGraph fan-in modes behave differently on unequal-depth branches: separate edges fire merge repeatedly per arrival, a list-form edge waits once for all named predecessors, and defer=True waits for active graph tasks even if a conditional branch was skipped.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(
        getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        1.85,
    )

    return Scene({
        c,
        title: 'Fan-In Scheduling Across Unequal-Depth Branches',
        padding: 16,
        gap: 12,
        contentWidth: 608,
        children: [
            Panel({
                c,
                title: '1. Separate Edges (add_edge per branch)',
                tone: 'warm',
                width: 608,
                padding: 12,
                titleFontSize: 19,
                children: Row({
                    gap: 10,
                    justify: 'center',
                    align: 'center',
                    children: [
                        TextLabel({ c, text: 'Fast branch finishes step 1', fontSize: 19 }),
                        FlowArrow({ c, direction: 'right', length: 20, tone: 'warm' }),
                        BadgePill({
                            c,
                            text: 'Merge runs twice (step 2 & 3)',
                            tone: 'warm',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: '2. List Join: add_edge(["lint", "tests", "bench"], "merge")',
                tone: 'green',
                width: 608,
                padding: 12,
                titleFontSize: 19,
                children: Column({
                    gap: 6,
                    children: [
                        Row({
                            gap: 10,
                            justify: 'center',
                            align: 'center',
                            children: [
                                TextLabel({ c, text: 'All named nodes ran', fontSize: 19 }),
                                FlowArrow({ c, direction: 'right', length: 20, tone: 'green' }),
                                BadgePill({
                                    c,
                                    text: 'Merge runs once at step 3',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'If bench is skipped by router, list join never fires',
                            fontSize: 19,
                            color: c.textMuted,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: '3. Deferred Merge: add_node("merge", fn, defer=True)',
                tone: 'blue',
                width: 608,
                padding: 12,
                titleFontSize: 19,
                children: Row({
                    gap: 10,
                    justify: 'center',
                    align: 'center',
                    children: [
                        TextLabel({ c, text: 'Active tasks drain', fontSize: 19 }),
                        FlowArrow({ c, direction: 'right', length: 20, tone: 'blue' }),
                        BadgePill({
                            c,
                            text: 'Runs once even with skipped route',
                            tone: 'blue',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
        ],
    })
}

export default create('dark')
