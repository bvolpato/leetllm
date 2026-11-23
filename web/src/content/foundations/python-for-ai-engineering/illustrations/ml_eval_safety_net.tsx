import {
    Column,
    MiniBarChart,
    Panel,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'Two bar charts comparing 100,000 float32 records in Python. Memory drops from 19.2 MB for list of dicts and 3.2 MB for list of floats to 0.4 MB for contiguous array(' +
    "'f'" +
    '). Scaled sum time stays near 1.20 to 1.48 ms in Python loops, then drops to 0.016 ms with zero-copy np.frombuffer.'

export const width = 660
export const height = 650
export const preset = 'engineering'

const illustration = defineIllustration((c) => {
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 628,
        align: 'center',
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Contiguous Storage Saves RAM; C Loops Unlock Speed',
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Panel({
                    c,
                    title: '1. Container + scalar footprint (100,000 float32 entries)',
                    tone: 'blue',
                    width: 620,
                    padding: '14px 18px',
                    gap: 14,
                    titleFontSize: 21,
                    align: 'center',
                    children: MiniBarChart({
                        c,
                        height: 155,
                        barWidth: 120,
                        gap: 56,
                        fontSize: 21,
                        max: 24,
                        minBarHeight: 4,
                        showValues: true,
                        ariaLabel: 'Memory footprint in megabytes for 100,000 float32 records',
                        data: [
                            {
                                label: 'list[dict]',
                                value: 19.2,
                                color: warm,
                                valueLabel: '19.2 MB',
                            },
                            { label: 'list[float]', value: 3.2, color: blue, valueLabel: '3.2 MB' },
                            { label: "array('f')", value: 0.4, color: green, valueLabel: '0.4 MB' },
                        ],
                    }),
                }),
                Panel({
                    c,
                    title: '2. Scaled sum runtime: sum(1.5 * x) on 100,000 items',
                    tone: 'green',
                    width: 620,
                    padding: '14px 18px',
                    gap: 14,
                    titleFontSize: 21,
                    align: 'center',
                    children: MiniBarChart({
                        c,
                        height: 155,
                        barWidth: 120,
                        gap: 56,
                        fontSize: 21,
                        max: 1.9,
                        minBarHeight: 4,
                        showValues: true,
                        ariaLabel: 'Scaled sum runtime in milliseconds for 100,000 items',
                        data: [
                            { label: 'list loop', value: 1.2, color: warm, valueLabel: '1.20 ms' },
                            {
                                label: 'array loop',
                                value: 1.48,
                                color: blue,
                                valueLabel: '1.48 ms',
                            },
                            {
                                label: 'frombuffer',
                                value: 0.016,
                                color: green,
                                valueLabel: '0.016 ms',
                            },
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
