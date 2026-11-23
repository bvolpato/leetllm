import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 680
export const height = 740
export const preset = 'engineering'
export const alt =
    'Constructed four-shard timeline on one shared 0–95 ms axis. Shard 1 returns five candidates at 44 ms, Shard 2 at 58 ms, Shard 3 at 86 ms, and Shard 4 at 51 ms. The slowest response arrives at 86 ms; a separate 3 ms merge ends at 89 ms. Each shard contributes five local candidates, for 20 IDs to rank by comparable scores and reduce to a global top five. This is one illustrative request, not a latency benchmark or percentile.'

const plot = { x: 138, y: 154, width: 512, height: 320 }
const x = (value: number) => plot.x + (value / 95) * plot.width
const y = (value: number) => plot.y + ((4.8 - value) / 4.8) * plot.height

function label(
    c: ThemeColors,
    text: string,
    xPosition: number,
    yPosition: number,
    labelWidth: number,
    fontSize = 24,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 650,
) {
    return (
        <CanvasItem
            x={xPosition}
            y={yPosition}
            width={labelWidth}
            height={Math.ceil(fontSize * 1.45)}
        >
            <TextLabel
                c={c}
                text={text}
                width="100%"
                fontSize={fontSize}
                fontWeight={weight}
                color={color}
                align={align}
            />
        </CanvasItem>
    )
}

const illustration = defineIllustration((colors) => {
    const c = { ...colors, shadow: 'transparent' }
    const shardTone = getReadableToneColor('blue', c)
    const slowTone = getReadableToneColor('critical', c)
    const mergeTone = getReadableToneColor('green', c)

    const responses = [
        { name: 'Shard 1', ms: 44, row: 4 },
        { name: 'Shard 2', ms: 58, row: 3 },
        { name: 'Shard 3', ms: 86, row: 2 },
        { name: 'Shard 4', ms: 51, row: 1 },
    ]

    const paths = [
        ...[30, 60, 90].map((tick) => ({
            points: [
                { x: tick, y: 0 },
                { x: tick, y: 4.8 },
            ],
            tone: 'neutral' as const,
            strokeWidth: 1,
            opacity: 0.25,
        })),
        {
            points: [
                { x: 0, y: 0 },
                { x: 95, y: 0 },
            ],
            tone: 'neutral' as const,
            strokeWidth: 2,
        },
        ...responses.map((entry) => ({
            points: [
                { x: 0, y: entry.row },
                { x: entry.ms, y: entry.row },
            ],
            tone: (entry.ms === 86 ? 'critical' : 'blue') as 'critical' | 'blue',
            strokeWidth: 14,
        })),
        {
            points: [
                { x: 86, y: 2 },
                { x: 86, y: 4.55 },
            ],
            tone: 'critical' as const,
            strokeWidth: 3,
            dashed: true,
        },
        {
            points: [
                { x: 86, y: 0.35 },
                { x: 89, y: 0.35 },
            ],
            tone: 'green' as const,
            strokeWidth: 14,
        },
    ]

    const points = [
        ...responses.map((entry) => ({
            x: entry.ms,
            y: entry.row,
            tone: (entry.ms === 86 ? 'critical' : 'blue') as 'critical' | 'blue',
            r: 8,
            stroke: c.bg,
            strokeWidth: 2,
        })),
        { x: 86, y: 0.35, tone: 'green' as const, r: 8, stroke: c.bg, strokeWidth: 2 },
        { x: 89, y: 0.35, tone: 'green' as const, r: 8, stroke: c.bg, strokeWidth: 2 },
    ]

    return (
        <Scene
            c={c}
            padding={0}
            gap={0}
            contentWidth={width}
            title="One slow shard gates the final merge"
        >
            <Board c={c} width={width} height={height}>
                {label(
                    c,
                    'The slowest shard gates completion',
                    22,
                    12,
                    636,
                    27,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'Constructed request · one common fan-out start',
                    22,
                    52,
                    636,
                    22,
                    c.textSecondary,
                )}
                {label(c, '86 ms · last reply', 430, 104, 220, 24, slowTone, 'right', 750)}

                {responses.map((entry) =>
                    label(
                        c,
                        entry.name,
                        18,
                        y(entry.row) - 16,
                        112,
                        22,
                        c.textPrimary,
                        'right',
                        700,
                    ),
                )}
                {responses
                    .filter((entry) => entry.ms !== 86)
                    .map((entry) =>
                        label(
                            c,
                            `${entry.ms} ms`,
                            x(entry.ms) + 10,
                            y(entry.row) - 16,
                            78,
                            22,
                            shardTone,
                            'left',
                            750,
                        ),
                    )}
                {label(c, '3 ms', x(86) - 82, y(0.35) - 18, 70, 22, mergeTone, 'right', 750)}

                <CanvasItem x={plot.x} y={plot.y} width={plot.width} height={plot.height}>
                    <AxisPlot
                        c={c}
                        width={plot.width}
                        height={plot.height}
                        xMin={0}
                        xMax={95}
                        yMin={0}
                        yMax={4.8}
                        padding={0}
                        showFrame={false}
                        showAxes={false}
                        showGrid={false}
                        paths={paths}
                        points={points}
                    />
                </CanvasItem>

                {[0, 30, 60, 90].map((tick) =>
                    label(c, `${tick}`, x(tick) - 28, 484, 56, 22, c.textSecondary, 'center', 650),
                )}
                {label(
                    c,
                    'Elapsed time (ms)',
                    plot.x,
                    518,
                    plot.width,
                    22,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(
                    c,
                    '86 ms wait + 3 ms merge = 89 ms total',
                    22,
                    564,
                    636,
                    24,
                    c.textPrimary,
                    'center',
                    750,
                )}
                {label(
                    c,
                    '4 × 5 local candidates → global top 5',
                    22,
                    608,
                    636,
                    24,
                    shardTone,
                    'center',
                    750,
                )}
                {label(
                    c,
                    'Merge comparable scores; ANN misses remain missing.',
                    22,
                    650,
                    636,
                    22,
                    c.textSecondary,
                    'center',
                    650,
                )}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
