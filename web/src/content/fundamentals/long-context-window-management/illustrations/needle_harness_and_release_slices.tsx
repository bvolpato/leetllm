import {
    BarChart,
    Column,
    DataTable,
    getThemeColors,
    Scene,
    StackedBar,
    TextLabel,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 760
export const height = 815
export const alt =
    'A 24-token needle harness reserves 2 instruction tokens, 16 filler tokens, a 2-token needle, and 4 output tokens. At depth 0.5, an edge reader checking only the first and last 4 tokens misses the middle needle while a full scan passes all depths. Across 100-case evaluation slices, baseline scores 90/90/90 and candidate scores 100/70/100: both average 90%, while the candidate fails an 85% per-depth floor.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.22)

    return Scene({
        c,
        density: 2.22,
        contentWidth: 730,
        padding: 8,
        gap: 6,
        children: [
            Column({
                gap: 6,
                align: 'center',
                children: [
                    StackedBar({
                        c,
                        width: 700,
                        height: 38,
                        title: '1 · Needle harness layout at depth 0.5 (24 tokens total)',
                        segments: [
                            { label: 'Instr (2)', value: 2, color: c.info },
                            { label: 'Fill A (8)', value: 8, color: c.neutralLight },
                            { label: 'Needle (2)', value: 2, color: c.warning },
                            { label: 'Fill B (8)', value: 8, color: c.neutralLight },
                            { label: 'Output (4)', value: 4, color: c.positive },
                        ],
                    }),
                    DataTable({
                        c,
                        width: 700,
                        fontSize: 23,
                        cellHeight: 34,
                        headerRows: 1,
                        align: ['left', 'center', 'center'],
                        rows: [
                            ['Needle depth', 'Edge probe (first/last 4)', 'Full window scan'],
                            ['0.0 (start)', 'Hit', 'Hit'],
                            ['0.5 (middle)', 'Miss (masked)', 'Hit'],
                            ['1.0 (end)', 'Hit', 'Hit'],
                        ],
                    }),
                    BarChart({
                        c,
                        title: '2 · Per-depth recall (%) vs 85% floor (both average 90%)',
                        width: 700,
                        height: 170,
                        min: 50,
                        max: 110,
                        format: (v) => `${Math.round(v)}%`,
                        showValues: true,
                        data: [
                            { label: 'Base 0%', value: 90, color: c.primary, valueLabel: '90%' },
                            { label: 'Base 50%', value: 90, color: c.primary, valueLabel: '90%' },
                            { label: 'Base 100%', value: 90, color: c.primary, valueLabel: '90%' },
                            { label: 'Cand 0%', value: 100, color: c.positive, valueLabel: '100%' },
                            {
                                label: 'Cand 50%',
                                value: 70,
                                color: c.critical,
                                valueLabel: '70% FAIL',
                            },
                            {
                                label: 'Cand 100%',
                                value: 100,
                                color: c.positive,
                                valueLabel: '100%',
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Gate every depth slice individually instead of pooling means',
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
