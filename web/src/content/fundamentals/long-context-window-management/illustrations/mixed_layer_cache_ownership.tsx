import {
    Column,
    Comparison,
    getThemeColors,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    TiledMatrix,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 760
export const height = 815
export const alt =
    'A 48-layer Gemma 4 12B architecture separates 40 local sliding-window layers from 8 full-attention layers. At 128K tokens in BF16, local layers retain 1,024 positions across 8 KV heads (256D) for 0.3125 GiB, while full layers retain 131,072 positions across 1 KV head (512D) for 2.000 GiB, totaling 2.3125 GiB instead of an erroneous 48 GiB uniform estimate.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 730,
        padding: 6,
        gap: 6,
        children: [
            Column({
                gap: 6,
                align: 'center',
                children: [
                    TiledMatrix({
                        c,
                        title: '48 physical layers (40 local 1K + 8 full 128K)',
                        rows: 6,
                        cols: 8,
                        cellSize: 18,
                        gap: 3,
                        regions: [
                            { rowStart: 0, rowEnd: 5, colStart: 0, colEnd: 8, tone: 'purple' },
                            { rowStart: 5, rowEnd: 6, colStart: 0, colEnd: 8, tone: 'blue' },
                        ],
                    }),
                    StackedBar({
                        c,
                        width: 680,
                        height: 28,
                        title: 'Actual BF16 K+V memory (2.3125 GiB)',
                        segments: [
                            {
                                label: 'Local: 0.3125 GiB',
                                value: 0.3125,
                                color: c.primary,
                                valueLabel: '13.5%',
                            },
                            {
                                label: 'Full: 2.000 GiB',
                                value: 2.0,
                                color: c.info,
                                valueLabel: '86.5%',
                            },
                        ],
                    }),
                    Comparison({
                        c,
                        sideWidth: 335,
                        gap: 12,
                        sides: [
                            {
                                title: 'Exact sum: 2.3125 GiB',
                                tone: 'green',
                                lines: [
                                    '40×8×256×1K×4B = 0.3125 GiB',
                                    '8×1×512×128K×4B = 2.000 GiB',
                                ],
                            },
                            {
                                title: 'Uniform error: 48.0 GiB',
                                tone: 'critical',
                                lines: [
                                    'Applies local shape to 48 layers',
                                    'Assumes 128K on all layers',
                                ],
                            },
                        ],
                    }),
                    Row({
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Masking hides distant tokens; eviction frees memory',
                                fontSize: 22,
                                color: c.textSecondary,
                                align: 'center',
                            }),
                        ],
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
