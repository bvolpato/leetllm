import { Column, Flow, getThemeColors, Panel, Scene, TextLabel, withDensity } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 760
export const height = 810
export const alt =
    'Three evidence routing paths depend on question structure. A single self-contained packet uses a full-context baseline with recall testing. A targeted single-fact query retrieves top-k labeled chunks for RAG with miss-risk checks. Cross-file questions filter candidates, pack labeled snippets, or aggregate exact counts over all matches.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 730,
        padding: 8,
        gap: 8,
        children: [
            Column({
                gap: 8,
                align: 'center',
                children: [
                    Panel({
                        c,
                        title: '1 · Single corpus fits budget stably',
                        tone: 'purple',
                        width: 716,
                        padding: 8,
                        gap: 4,
                        children: [
                            Flow({
                                c,
                                direction: 'horizontal',
                                gap: 4,
                                connectorLength: 14,
                                stages: [
                                    { title: 'Fits window', tone: 'neutral', width: 175 },
                                    { title: 'Full prompt', tone: 'purple', width: 185 },
                                    { title: 'Depth test', tone: 'green', width: 175 },
                                ],
                            }),
                        ],
                    }),
                    Panel({
                        c,
                        title: '2 · Targeted single-fact lookup',
                        tone: 'green',
                        width: 716,
                        padding: 8,
                        gap: 4,
                        children: [
                            Flow({
                                c,
                                direction: 'horizontal',
                                gap: 4,
                                connectorLength: 14,
                                stages: [
                                    { title: 'Large archive', tone: 'neutral', width: 175 },
                                    { title: 'Top-k RAG', tone: 'green', width: 185 },
                                    { title: 'Miss audit', tone: 'warm', width: 175 },
                                ],
                            }),
                        ],
                    }),
                    Panel({
                        c,
                        title: '3 · Cross-file comparison or full count',
                        tone: 'blue',
                        width: 716,
                        padding: 8,
                        gap: 4,
                        children: [
                            Flow({
                                c,
                                direction: 'horizontal',
                                gap: 4,
                                connectorLength: 14,
                                stages: [
                                    { title: 'Joint clues', tone: 'neutral', width: 175 },
                                    { title: 'Filter + pack', tone: 'blue', width: 185 },
                                    { title: 'Exact count', tone: 'green', width: 175 },
                                ],
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Match routing strategy to scope and completeness rules',
                        fontSize: 23,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
