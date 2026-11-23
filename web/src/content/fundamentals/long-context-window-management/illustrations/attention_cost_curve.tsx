import {
    BarChart,
    Column,
    getThemeColors,
    LineChart,
    Scene,
    TextLabel,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 780
export const alt =
    'Prefill work on a log2 scale relative to 4K tokens rises to 10 (1,024x) at 128K for full attention versus 5 (32x) for a 4K sliding window. At 128K tokens across 80 layers and 8 KV heads (head dim 128, BF16), KV cache uses 40 GiB for 1 GQA sequence, 160 GiB for 4 GQA sequences, and 320 GiB for 1 MHA sequence compared against roughly 130 GiB of weights.'

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
                gap: 10,
                align: 'center',
                children: [
                    LineChart({
                        c,
                        title: '1 · Prefill compute (log2 vs 4K)',
                        width: 680,
                        height: 225,
                        labels: ['4K', '8K', '16K', '32K', '64K', '128K'],
                        min: 0,
                        max: 11,
                        format: (v) => `${Math.round(v)}`,
                        showPoints: true,
                        directLabels: true,
                        series: [
                            {
                                name: 'Full O(L²): 1,024×',
                                points: [0, 2, 4, 6, 8, 10],
                                color: c.primary,
                            },
                            {
                                name: '4K window O(Lw): 32×',
                                points: [0, 1, 2, 3, 4, 5],
                                color: c.positive,
                            },
                        ],
                    }),
                    BarChart({
                        c,
                        title: '2 · 128K decode KV state (GiB)',
                        width: 680,
                        height: 225,
                        min: 0,
                        max: 350,
                        format: (v) => `${Math.round(v)}`,
                        showValues: true,
                        data: [
                            { label: '1x GQA', value: 40, color: c.primary, valueLabel: '40 GiB' },
                            {
                                label: 'Weights',
                                value: 130,
                                color: c.warning,
                                valueLabel: '130 GiB',
                            },
                            { label: '4x GQA', value: 160, color: c.info, valueLabel: '160 GiB' },
                            {
                                label: '1x MHA',
                                value: 320,
                                color: c.critical,
                                valueLabel: '320 GiB',
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: '80 layers · 128D · BF16 · KV scales with length and batch',
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
