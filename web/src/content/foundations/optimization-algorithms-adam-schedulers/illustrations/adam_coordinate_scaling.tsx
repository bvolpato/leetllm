import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 800
export const height = 500
export const preset = 'engineering'
export const alt =
    'Adam replays four gradients from zero moments with learning rate 0.01, beta1 0.9, and beta2 0.999. Left: magnitude plot shows coordinate a updates 0.01, 0.00058, 0.00346, 0.00041 while b stays near 0.01. Right: at step 4, corrected direction 3.228 divided by scale 78.902 times 0.01 gives a step near 0.00041, while direction 0.967 divided by scale 0.970 gives b a step near 0.00997, about 24.4 times a.'

const gradients = [
    [100, 1],
    [-80, 0.98],
    [70, 0.96],
    [-60, 0.94],
]

function replay() {
    const m = [0, 0]
    const v = [0, 0]
    return gradients.map((g, i) => {
        const t = i + 1
        for (let j = 0; j < 2; j++) {
            m[j] = 0.9 * m[j] + 0.1 * g[j]
            v[j] = 0.999 * v[j] + 0.001 * g[j] ** 2
        }
        const direction = m.map((n) => n / (1 - 0.9 ** t))
        const scale = v.map((n) => Math.sqrt(n / (1 - 0.999 ** t)))
        return { direction, scale, step: direction.map((n, j) => (0.01 * n) / (scale[j] + 1e-8)) }
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const history = replay()
    const final = history[3]
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 24,
        color = c.textPrimary,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={size + 12}>
            <TextLabel c={c} text={text} fontSize={size} color={color} />
        </CanvasItem>
    )
    const xPos = (step: number) => 104 + ((step - 1) * 320) / 3
    const yPos = (value: number) => 388 - (value / 0.0105) * 198
    return (
        <Scene c={c} padding={16} gap={0} contentWidth={768} background={c.bgSubtle}>
            <Board c={c} width={768} height={468} background={c.bgSubtle}>
                <CanvasItem x={0} y={0} width={768} height={468}>
                    <svg width={768} height={468} viewBox="0 0 768 468">
                        {[0, 0.005, 0.01].map((value) => (
                            <React.Fragment key={value}>
                                <VectorSegment
                                    x1={104}
                                    y1={yPos(value)}
                                    x2={424}
                                    y2={yPos(value)}
                                    color={c.borderLight}
                                    strokeWidth={1.5}
                                    showStartDot={false}
                                    showEndDot={false}
                                />
                            </React.Fragment>
                        ))}
                        <VectorSegment
                            x1={104}
                            y1={190}
                            x2={104}
                            y2={388}
                            color={c.borderLight}
                            strokeWidth={2}
                            showStartDot={false}
                            showEndDot={false}
                        />
                        <VectorSegment
                            x1={448}
                            y1={16}
                            x2={448}
                            y2={452}
                            color={c.borderLight}
                            strokeWidth={2}
                            showStartDot={false}
                            showEndDot={false}
                        />
                        {[158, 280].map((base) => (
                            <React.Fragment key={base}>
                                <VectorSegment
                                    x1={506}
                                    y1={base + 34}
                                    x2={610}
                                    y2={base + 34}
                                    color={c.textSecondary}
                                    strokeWidth={2}
                                    showStartDot={false}
                                    showEndDot={false}
                                />
                                <VectorArrow
                                    x1={620}
                                    y1={base + 34}
                                    x2={656}
                                    y2={base + 34}
                                    color={c.textSecondary}
                                    strokeWidth={2.5}
                                    arrowSize={5}
                                />
                            </React.Fragment>
                        ))}
                    </svg>
                </CanvasItem>
                <CanvasItem x={96} y={182} width={336} height={214}>
                    <AxisPlot
                        c={c}
                        width={336}
                        height={214}
                        padding={8}
                        xMin={1}
                        xMax={4}
                        yMin={0}
                        yMax={0.0105}
                        showFrame={false}
                        showAxes={false}
                        paths={[0, 1].map((j) => ({
                            points: history.map((row, i) => ({
                                x: i + 1,
                                y: Math.abs(row.step[j]),
                            })),
                            color: j === 0 ? purple : cyan,
                            strokeWidth: 3,
                        }))}
                        points={[0, 1].flatMap((j) =>
                            history.map((row, i) => ({
                                x: i + 1,
                                y: Math.abs(row.step[j]),
                                fill: j === 0 ? purple : cyan,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                                r: 5,
                            })),
                        )}
                    />
                </CanvasItem>
                {label(12, 8, 424, 'Subtracted step magnitude', 26)}
                {label(12, 46, 424, 'lr = 0.01 · β₁ = 0.9 · β₂ = 0.999', 24, c.textSecondary)}
                {label(12, 86, 86, 'g(a)', 24, purple)}
                {label(12, 124, 86, 'g(b)', 24, cyan)}
                {[0, 1, 2, 3].map((i) => (
                    <React.Fragment key={i}>
                        {label(98 + 86 * i, 86, 82, String(gradients[i][0]), 24, purple)}
                        {label(98 + 86 * i, 124, 82, String(gradients[i][1]), 24, cyan)}
                    </React.Fragment>
                ))}
                {[0, 0.005, 0.01].map((value) => (
                    <React.Fragment key={value}>
                        {label(8, yPos(value) - 18, 92, value.toFixed(3), 24, c.textSecondary)}
                    </React.Fragment>
                ))}
                {[1, 2, 3, 4].map((step) => (
                    <React.Fragment key={step}>
                        {label(xPos(step) - 10, 396, 36, String(step), 24, c.textSecondary)}
                    </React.Fragment>
                ))}
                {label(12, 430, 224, 'a · alternating', 24, purple)}
                {label(250, 430, 190, 'b · same sign', 24, cyan)}
                {label(466, 8, 294, 'Step 4 · dir / scale', 26)}
                {label(466, 48, 294, 'Corrected moments × lr', 24, c.textSecondary)}
                {label(466, 90, 294, 'Both steps subtracted', 24, c.textSecondary)}
                {[0, 1].map((j) => (
                    <React.Fragment key={j}>
                        {label(
                            466,
                            174 + j * 122,
                            36,
                            j === 0 ? 'a' : 'b',
                            28,
                            j === 0 ? purple : cyan,
                        )}
                        {label(
                            510,
                            152 + j * 122,
                            96,
                            final.direction[j].toFixed(3),
                            24,
                            j === 0 ? purple : cyan,
                        )}
                        {label(
                            510,
                            194 + j * 122,
                            96,
                            final.scale[j].toFixed(3),
                            24,
                            j === 0 ? purple : cyan,
                        )}
                        {label(
                            660,
                            174 + j * 122,
                            102,
                            final.step[j].toFixed(5),
                            24,
                            j === 0 ? purple : cyan,
                        )}
                    </React.Fragment>
                ))}
                {label(
                    466,
                    412,
                    294,
                    `b step / a step ≈ ${(final.step[1] / final.step[0]).toFixed(1)}`,
                    25,
                    c.textSecondary,
                )}
            </Board>
        </Scene>
    )
}

export default create('dark')
