import {
    BarChart,
    Column,
    getThemeColors,
    Panel,
    Scene,
    StackedBar,
    TextLabel,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 760
export const height = 810
export const alt =
    'A 64 GiB KV cache pool holds only one 40 GiB BF16 128K sequence (leaving 24 GiB unused, short of a second 40 GiB sequence), whereas quantized FP8 KVs at 20 GiB per sequence fit three concurrent sequences with 4 GiB remaining.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.25)

    return Scene({
        c,
        density: 2.25,
        contentWidth: 730,
        padding: 8,
        gap: 6,
        children: [
            Column({
                gap: 6,
                align: 'center',
                children: [
                    Panel({
                        c,
                        title: 'BF16 KV (40 GiB): 1 fits, 24 GiB unused',
                        width: 710,
                        padding: 8,
                        gap: 4,
                        tone: 'purple',
                        children: [
                            StackedBar({
                                c,
                                width: 680,
                                height: 34,
                                segments: [
                                    { label: 'Seq 1 (40 GiB)', value: 40, color: c.primary },
                                    { label: 'Unused (24 GiB)', value: 24, color: c.neutralLight },
                                ],
                            }),
                        ],
                    }),
                    Panel({
                        c,
                        title: 'FP8 KV (20 GiB each): 3 fit, 4 GiB remaining',
                        width: 710,
                        padding: 8,
                        gap: 4,
                        tone: 'blue',
                        children: [
                            StackedBar({
                                c,
                                width: 680,
                                height: 34,
                                segments: [
                                    { label: 'Seq 1 (20)', value: 20, color: c.info },
                                    { label: 'Seq 2 (20)', value: 20, color: c.primary },
                                    { label: 'Seq 3 (20)', value: 20, color: c.positive },
                                    { label: '4 GiB', value: 4, color: c.neutralLight },
                                ],
                            }),
                        ],
                    }),
                    BarChart({
                        c,
                        title: 'Concurrent 128K requests in 64 GiB',
                        width: 710,
                        height: 165,
                        min: 0,
                        max: 3,
                        format: (v) => `${Math.round(v)}`,
                        showValues: true,
                        data: [
                            {
                                label: 'BF16 (40 GiB)',
                                value: 1,
                                color: c.primary,
                                valueLabel: '1 seq',
                            },
                            {
                                label: 'FP8 (20 GiB)',
                                value: 3,
                                color: c.positive,
                                valueLabel: '3 seqs',
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Reserve headroom for scales, blocks, and output growth',
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
