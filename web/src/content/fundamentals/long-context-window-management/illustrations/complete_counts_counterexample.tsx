import {
    BarChart,
    Column,
    DataTable,
    getThemeColors,
    Scene,
    TextLabel,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 740
export const alt =
    'Seven module scan records show why similarity top-k cannot replace exhaustive counting. Filtering v2 legacy_softmax call sites keeps m1 through m5. Top-2 retrieval selects m1 (0.99) and m2 (0.98), both in encoder (encoder 2, decoder 0), whereas counting all five matches gives encoder 2 and decoder 3.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 690,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 12,
                align: 'center',
                children: [
                    DataTable({
                        c,
                        width: 670,
                        fontSize: 21,
                        cellHeight: 36,
                        headerRows: 1,
                        align: ['left', 'center', 'left', 'left', 'right', 'center'],
                        rows: [
                            ['ID', 'Ver', 'Module', 'Kernel', 'Score', 'Filter'],
                            ['m1', 'v2', 'encoder', 'legacy_softmax', '0.99', 'keep'],
                            ['m2', 'v2', 'encoder', 'legacy_softmax', '0.98', 'keep'],
                            ['m3', 'v2', 'decoder', 'legacy_softmax', '0.80', 'keep'],
                            ['m4', 'v2', 'decoder', 'legacy_softmax', '0.79', 'keep'],
                            ['m5', 'v2', 'decoder', 'legacy_softmax', '0.78', 'keep'],
                            ['m6', 'v1', 'encoder', 'legacy_softmax', '0.97', 'skip'],
                            ['m7', 'v2', 'encoder', 'flash_attn', '0.96', 'skip'],
                        ],
                    }),
                    BarChart({
                        c,
                        title: 'Top-2 RAG reverses true v2 legacy_softmax leader',
                        width: 670,
                        height: 220,
                        min: 0,
                        max: 3,
                        format: (v) => `${Math.round(v)}`,
                        showValues: true,
                        data: [
                            { label: 'Top-2: enc', value: 2, color: c.warning, valueLabel: '2' },
                            { label: 'Top-2: dec', value: 0, color: c.critical, valueLabel: '0' },
                            { label: 'All 5: enc', value: 2, color: c.info, valueLabel: '2' },
                            {
                                label: 'All 5: dec',
                                value: 3,
                                color: c.positive,
                                valueLabel: '3 (lead)',
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Run deterministic queries for exact counts before LLM synthesis',
                        fontSize: 22,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
