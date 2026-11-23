import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 620
export const height = 710
export const alt =
    'The negative-log curve L equals minus ln of the probability on the correct token. In the worked sequence, docs has target probability 0.114 and loss 2.170 nats; today has probability 0.736 and loss 0.306 nats. Averaging these two supervised positions gives 1.238 nats, with docs accounting for 87.6 percent of the summed loss.'

const illustration = defineIllustration((c: ThemeColors) => {
    const purple = getReadableToneColor('purple', c)
    const docs = getReadableToneColor('critical', c)
    const today = getReadableToneColor('green', c)
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
    const plot = { left: 70, right: 576, top: 140, bottom: 350 }
    const px = (probability: number) => plot.left + probability * (plot.right - plot.left)
    const py = (loss: number) => plot.bottom - (loss / 3.2) * (plot.bottom - plot.top)
    const curve = Array.from({ length: 49 }, (_, index) => {
        const probability = 0.05 + index * (0.95 / 48)
        return `${index === 0 ? 'M' : 'L'} ${px(probability).toFixed(2)} ${py(-Math.log(probability)).toFixed(2)}`
    }).join(' ')

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={620} background={c.bgSubtle}>
            <Board c={c} width={620} height={710} background={c.bgSubtle}>
                {text(
                    8,
                    8,
                    604,
                    42,
                    'A weak target probability costs more',
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
                    'Lower target probability, larger loss.',
                    24,
                    c.textSecondary,
                    550,
                    'center',
                )}
                {text(34, 97, 540, 32, 'Loss in nats  ·  L = −ln(p)', 24, c.textSecondary, 650)}
                <CanvasItem x={0} y={0} width={620} height={690}>
                    <svg width="620" height="690" viewBox="0 0 620 690" aria-hidden="true">
                        {[0, 1, 2, 3].map((loss) => (
                            <g key={`y-${loss}`}>
                                <line
                                    x1={plot.left}
                                    y1={py(loss)}
                                    x2={plot.right}
                                    y2={py(loss)}
                                    stroke={c.borderSubtle}
                                    strokeWidth={1.5}
                                    strokeDasharray="5 6"
                                />
                                <line
                                    x1={plot.left - 5}
                                    y1={py(loss)}
                                    x2={plot.left}
                                    y2={py(loss)}
                                    stroke={c.textSecondary}
                                    strokeWidth={2}
                                />
                            </g>
                        ))}
                        {[0.1, 0.5, 1.0].map((probability) => (
                            <line
                                key={`x-${probability}`}
                                x1={px(probability)}
                                y1={plot.top}
                                x2={px(probability)}
                                y2={plot.bottom}
                                stroke={c.borderSubtle}
                                strokeWidth={1.5}
                                strokeDasharray="5 6"
                            />
                        ))}
                        <line
                            x1={plot.left}
                            y1={plot.top}
                            x2={plot.left}
                            y2={plot.bottom}
                            stroke={c.textSecondary}
                            strokeWidth={2}
                        />
                        <line
                            x1={plot.left}
                            y1={plot.bottom}
                            x2={plot.right}
                            y2={plot.bottom}
                            stroke={c.textSecondary}
                            strokeWidth={2}
                        />
                        <path
                            d={curve}
                            fill="none"
                            stroke={purple}
                            strokeWidth={5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {[
                            { p: 0.114, loss: 2.17, color: docs },
                            { p: 0.736, loss: 0.306, color: today },
                        ].map((point) => (
                            <g key={point.color}>
                                <line
                                    x1={px(point.p)}
                                    y1={py(point.loss)}
                                    x2={px(point.p)}
                                    y2={plot.bottom}
                                    stroke={point.color}
                                    strokeWidth={2}
                                    strokeDasharray="6 5"
                                    opacity="0.8"
                                />
                                <line
                                    x1={plot.left}
                                    y1={py(point.loss)}
                                    x2={px(point.p)}
                                    y2={py(point.loss)}
                                    stroke={point.color}
                                    strokeWidth={2}
                                    strokeDasharray="6 5"
                                    opacity="0.8"
                                />
                                <circle
                                    cx={px(point.p)}
                                    cy={py(point.loss)}
                                    r={10}
                                    fill={point.color}
                                    stroke={c.bgCard}
                                    strokeWidth={3}
                                />
                            </g>
                        ))}
                    </svg>
                </CanvasItem>
                {[3, 2, 1, 0].map((loss) =>
                    text(
                        24,
                        py(loss) - 16,
                        42,
                        32,
                        String(loss),
                        24,
                        c.textSecondary,
                        550,
                        'right',
                        true,
                    ),
                )}
                {text(px(0.1) - 26, 352, 52, 32, '0.1', 24, c.textSecondary, 550, 'center', true)}
                {text(px(0.5) - 26, 352, 52, 32, '0.5', 24, c.textSecondary, 550, 'center', true)}
                {text(px(1.0) - 26, 352, 52, 32, '1.0', 24, c.textSecondary, 550, 'center', true)}
                {text(
                    96,
                    385,
                    456,
                    32,
                    'Correct-token probability  p',
                    24,
                    c.textSecondary,
                    600,
                    'center',
                )}

                {text(28, 430, 264, 35, 'docs · missed', 26, docs, 750, 'center')}
                {text(28, 468, 264, 35, 'p=.114 · L=2.170', 26, c.textPrimary, 750, 'center', true)}
                {text(328, 430, 264, 35, 'today · favored', 26, today, 750, 'center')}
                {text(328, 468, 264, 35, 'p=.736 · L=.306', 26, c.textPrimary, 750, 'center', true)}

                {text(
                    18,
                    519,
                    584,
                    35,
                    '(2.170 + 0.306) / 2  =  1.238 nats',
                    26,
                    c.textPrimary,
                    850,
                    'center',
                    true,
                )}
                {text(
                    18,
                    555,
                    584,
                    32,
                    'Mean over two supervised positions',
                    24,
                    c.textSecondary,
                    600,
                    'center',
                )}
                <CanvasItem x={18} y={588} width={584} height={28}>
                    <svg width="584" height="28" viewBox="0 0 584 28" aria-hidden="true">
                        <rect x="0" y="0" width="511.6" height="28" rx="14" fill={docs} />
                        <rect x="511.6" y="0" width="72.4" height="28" rx="14" fill={today} />
                    </svg>
                </CanvasItem>
                {text(18, 624, 286, 35, 'docs 87.6% of sum', 26, docs, 750, 'center')}
                {text(316, 624, 286, 35, 'today 12.4% of sum', 26, today, 750, 'center')}
                {text(
                    18,
                    664,
                    584,
                    32,
                    'Total loss before averaging: 2.476 nats.',
                    24,
                    c.textSecondary,
                    500,
                    'center',
                )}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
