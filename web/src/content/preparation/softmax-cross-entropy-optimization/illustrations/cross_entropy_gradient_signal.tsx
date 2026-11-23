import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 620
export const height = 644
export const alt =
    'For each class, the diagram compares predicted probability p with one-hot target y on a zero-to-one line. The gradients p minus y are plus 0.844 for bug, minus 0.886 for docs, and plus 0.042 for security. Gradient descent subtracts these values, lowering the two competing logits and raising the docs logit. The three gradients sum to zero.'

const rows = [
    {
        label: 'bug',
        probability: 0.844,
        target: 0,
        gradient: '+0.844',
        action: 'lower bug score',
        color: 'critical' as const,
    },
    {
        label: 'docs',
        probability: 0.114,
        target: 1,
        gradient: '−0.886',
        action: 'raise docs',
        color: 'green' as const,
        correct: true,
    },
    {
        label: 'security',
        probability: 0.042,
        target: 0,
        gradient: '+0.042',
        action: 'lower slightly',
        color: 'cyan' as const,
    },
] as const

const illustration = defineIllustration((c: ThemeColors) => {
    const prediction = getReadableToneColor('purple', c)
    const target = getReadableToneColor('warm', c)
    const lineStart = 172
    const lineEnd = 406
    const text = (
        x: number,
        y: number,
        boxWidth: number,
        boxHeight: number,
        value: string,
        size = 22,
        color = c.textPrimary,
        weight = 500,
        align: 'left' | 'center' | 'right' = 'left',
        mono = false,
        math = false,
    ) => (
        <CanvasItem x={x} y={y} width={boxWidth} height={boxHeight}>
            <TextLabel
                c={c}
                text={value}
                width={boxWidth}
                fontSize={size}
                fontWeight={weight}
                color={color}
                align={align}
                mono={mono}
                math={math}
            />
        </CanvasItem>
    )

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={620} background={c.bgSubtle}>
            <Board c={c} width={620} height={644} background={c.bgSubtle}>
                {text(
                    8,
                    8,
                    604,
                    42,
                    'Each class gets a gradient signal',
                    30,
                    c.textPrimary,
                    850,
                    'center',
                )}
                {text(
                    12,
                    48,
                    596,
                    32,
                    '∂L/∂zᵢ = pᵢ − yᵢ',
                    24,
                    c.textSecondary,
                    600,
                    'center',
                    true,
                    true,
                )}
                {text(
                    25,
                    95,
                    570,
                    36,
                    'SGD step:  zᵢ ← zᵢ − η(pᵢ − yᵢ)',
                    26,
                    c.textPrimary,
                    750,
                    'center',
                    true,
                    true,
                )}

                <CanvasItem x={0} y={0} width={620} height={644}>
                    <svg width="620" height="644" viewBox="0 0 620 644" aria-hidden="true">
                        <circle cx="24" cy="164" r="7" fill={prediction} />
                        <rect
                            x="147"
                            y="157"
                            width="14"
                            height="14"
                            rx="2"
                            fill={target}
                            transform="rotate(45 154 164)"
                        />
                        <line
                            x1="318"
                            y1="164"
                            x2="342"
                            y2="164"
                            stroke={c.textSecondary}
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                    </svg>
                </CanvasItem>
                {text(38, 148, 105, 32, 'model p', 24, c.textSecondary, 650)}
                {text(174, 148, 112, 32, 'target y', 24, c.textSecondary, 650)}
                {text(355, 148, 225, 32, 'difference p − y', 24, c.textSecondary, 650)}
                {text(150, 182, 44, 32, '0', 24, c.textSecondary, 550, 'center', true)}
                {text(267, 182, 50, 32, '0.5', 24, c.textSecondary, 550, 'center', true)}
                {text(384, 182, 44, 32, '1', 24, c.textSecondary, 550, 'center', true)}

                <CanvasItem x={0} y={0} width={620} height={644}>
                    <svg width="620" height="644" viewBox="0 0 620 644" aria-hidden="true">
                        {rows.map((row, index) => {
                            const y = 254 + index * 102
                            const pX = lineStart + row.probability * (lineEnd - lineStart)
                            const yX = lineStart + row.target * (lineEnd - lineStart)
                            const color = getReadableToneColor(row.color, c)
                            return (
                                <g key={row.label}>
                                    {row.label === 'docs' && (
                                        <SvgFrame
                                            c={c}
                                            x={12}
                                            y={y - 46}
                                            width={596}
                                            height={92}
                                            rx={14}
                                            fill={c.bgHover}
                                            stroke={color}
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    <line
                                        x1={lineStart}
                                        y1={y}
                                        x2={lineEnd}
                                        y2={y}
                                        stroke={c.borderLight}
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1={lineStart}
                                        y1={y - 8}
                                        x2={lineStart}
                                        y2={y + 8}
                                        stroke={c.borderLight}
                                        strokeWidth={2}
                                    />
                                    <line
                                        x1={(lineStart + lineEnd) / 2}
                                        y1={y - 8}
                                        x2={(lineStart + lineEnd) / 2}
                                        y2={y + 8}
                                        stroke={c.borderLight}
                                        strokeWidth={2}
                                    />
                                    <line
                                        x1={lineEnd}
                                        y1={y - 8}
                                        x2={lineEnd}
                                        y2={y + 8}
                                        stroke={c.borderLight}
                                        strokeWidth={2}
                                    />
                                    <VectorSegment
                                        x1={yX}
                                        y1={y}
                                        x2={pX}
                                        y2={y}
                                        color={color}
                                        strokeWidth={row.label === 'docs' ? 6 : 5}
                                        showStartDot={false}
                                        showEndDot={false}
                                    />
                                    <rect
                                        x={yX - 7}
                                        y={y - 7}
                                        width={14}
                                        height={14}
                                        rx={2}
                                        fill={target}
                                        stroke={c.bgCard}
                                        strokeWidth={2}
                                        transform={`rotate(45 ${yX} ${y})`}
                                    />
                                    <circle
                                        cx={pX}
                                        cy={y}
                                        r={9}
                                        fill={prediction}
                                        stroke={c.bgCard}
                                        strokeWidth={2.5}
                                    />
                                </g>
                            )
                        })}
                    </svg>
                </CanvasItem>
                {rows.map((row, index) => {
                    const y = 254 + index * 102
                    const color = getReadableToneColor(row.color, c)
                    return (
                        <React.Fragment key={row.label}>
                            {text(18, y - 34, 132, 35, row.label, 26, color, 800)}
                            {text(
                                18,
                                y + 4,
                                96,
                                32,
                                `p=${row.probability.toFixed(3).replace(/^0/, '')}`,
                                24,
                                c.textSecondary,
                                550,
                                'left',
                                true,
                            )}
                            {text(
                                122,
                                y + 4,
                                40,
                                32,
                                `y=${row.target}`,
                                24,
                                c.textSecondary,
                                550,
                                'left',
                                true,
                            )}
                            {text(
                                432,
                                y - 28,
                                172,
                                35,
                                row.gradient,
                                26,
                                color,
                                850,
                                'center',
                                true,
                            )}
                            {text(
                                420,
                                y + 8,
                                190,
                                32,
                                row.action,
                                24,
                                c.textSecondary,
                                650,
                                'center',
                            )}
                        </React.Fragment>
                    )
                })}

                {text(
                    24,
                    542,
                    572,
                    35,
                    '+0.844  − 0.886  + 0.042  =  0',
                    26,
                    c.textPrimary,
                    750,
                    'center',
                    true,
                )}
                {text(
                    18,
                    590,
                    584,
                    32,
                    'Raising docs offsets both competitor decreases.',
                    24,
                    c.textSecondary,
                    550,
                    'center',
                )}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
