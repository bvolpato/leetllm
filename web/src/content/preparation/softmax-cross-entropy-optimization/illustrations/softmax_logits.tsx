import React from 'react'
import {
    Board,
    CanvasItem,
    ProgressRow,
    Scene,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 620
export const height = 728
export const alt =
    'A support-ticket classifier turns logits bug 3.0, docs 1.0, and security 0.0 into probabilities. Subtracting the peak 3.0 gives 0, minus 2, minus 3; exponentiation gives weights 1, 0.135, 0.050, which sum to 1.185. Dividing each weight by that sum gives 84.4%, 11.4%, and 4.2%. The shared max shift keeps the largest exponent at one and preserves the probabilities.'

const illustration = defineIllustration((c: ThemeColors) => {
    const bug = getReadableToneColor('critical', c)
    const docs = getReadableToneColor('green', c)
    const security = getReadableToneColor('cyan', c)
    const purple = getReadableToneColor('purple', c)
    const colors = [bug, docs, security]
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
            <Board c={c} width={620} height={728} background={c.bgSubtle}>
                {text(
                    8,
                    8,
                    604,
                    42,
                    'From scores to probability shares',
                    30,
                    c.textPrimary,
                    850,
                    'center',
                )}
                {text(
                    12,
                    48,
                    596,
                    34,
                    'Triage scores for “This docs page is stale.”',
                    24,
                    c.textSecondary,
                    500,
                    'center',
                )}

                {text(16, 91, 588, 36, '1  Raw model scores  z', 26, purple, 800)}
                {[
                    { label: 'bug', value: '3.0' },
                    { label: 'docs', value: '1.0' },
                    { label: 'security', value: '0.0' },
                ].map((item, index) => {
                    const x = 14 + index * 198
                    return (
                        <React.Fragment key={item.label}>
                            {text(x + 8, 137, 108, 35, item.label, 26, colors[index], 750)}
                            {text(
                                x + 118,
                                133,
                                62,
                                37,
                                item.value,
                                28,
                                c.textPrimary,
                                850,
                                'right',
                                true,
                            )}
                        </React.Fragment>
                    )
                })}

                {text(
                    16,
                    202,
                    588,
                    36,
                    '2  Subtract the shared maximum  m = 3.0',
                    26,
                    c.textPrimary,
                    750,
                )}
                {text(14, 237, 194, 35, '3 − 3 = 0', 26, bug, 750, 'center', true)}
                {text(213, 237, 194, 35, '1 − 3 = −2', 26, docs, 750, 'center', true)}
                {text(412, 237, 194, 35, '0 − 3 = −3', 26, security, 750, 'center', true)}
                <CanvasItem x={290} y={273} width={40} height={36}>
                    <svg width="40" height="36" viewBox="0 0 40 36" aria-hidden="true">
                        <VectorArrow
                            x1={20}
                            y1={1}
                            x2={20}
                            y2={32}
                            color={purple}
                            strokeWidth={3}
                            arrowSize={8}
                        />
                    </svg>
                </CanvasItem>

                {text(
                    16,
                    307,
                    588,
                    36,
                    '3  Exponentiate the shifted scores',
                    26,
                    c.textPrimary,
                    750,
                )}
                {[
                    { label: 'bug', value: '1.000', weight: 1, tone: 'critical' as const },
                    { label: 'docs', value: '0.135', weight: Math.exp(-2), tone: 'green' as const },
                    {
                        label: 'security',
                        value: '0.050',
                        weight: Math.exp(-3),
                        tone: 'cyan' as const,
                    },
                ].map((row, index) => {
                    const y = 344 + index * 42
                    return (
                        <React.Fragment key={row.label}>
                            {text(
                                16,
                                y,
                                112,
                                35,
                                row.label,
                                26,
                                getReadableToneColor(row.tone, c),
                                750,
                            )}
                            {text(388, y, 194, 35, row.value, 26, c.textPrimary, 700, 'left', true)}
                            <CanvasItem x={124} y={y + 4} width={254} height={23}>
                                <ProgressRow
                                    c={c}
                                    label=""
                                    value={row.weight}
                                    valueLabel=""
                                    tone={row.tone}
                                    labelWidth={0}
                                    valueWidth={0}
                                    barHeight={23}
                                    fontSize={1}
                                />
                            </CanvasItem>
                        </React.Fragment>
                    )
                })}
                {text(
                    16,
                    468,
                    588,
                    35,
                    'Shared weight sum  =  1.185',
                    26,
                    c.textSecondary,
                    650,
                    'center',
                    true,
                )}
                <CanvasItem x={290} y={498} width={40} height={36}>
                    <svg width="40" height="36" viewBox="0 0 40 36" aria-hidden="true">
                        <VectorArrow
                            x1={20}
                            y1={1}
                            x2={20}
                            y2={32}
                            color={docs}
                            strokeWidth={3}
                            arrowSize={8}
                        />
                    </svg>
                </CanvasItem>

                {text(16, 532, 588, 36, '4  Divide each weight by 1.185', 26, c.textPrimary, 750)}
                <CanvasItem x={18} y={570} width={584} height={30}>
                    <svg width="584" height="30" viewBox="0 0 584 30" aria-hidden="true">
                        <rect x="0" y="1" width="493.0" height="28" rx="14" fill={bug} />
                        <rect x="493.0" y="1" width="66.6" height="28" fill={docs} />
                        <rect x="559.6" y="1" width="24.4" height="28" rx="12" fill={security} />
                    </svg>
                </CanvasItem>
                {text(14, 606, 194, 35, 'bug   84.4%', 26, bug, 800, 'center')}
                {text(213, 606, 194, 35, 'docs   11.4%', 26, docs, 800, 'center')}
                {text(412, 606, 194, 35, 'security   4.2%', 26, security, 800, 'center')}

                {text(
                    18,
                    650,
                    584,
                    35,
                    'zᵢ − m ≤ 0  ⇒  exp(zᵢ−m) ≤ 1.0',
                    26,
                    c.textPrimary,
                    700,
                    'center',
                    true,
                )}
                {text(
                    18,
                    688,
                    584,
                    34,
                    'A shared shift preserves the probabilities.',
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
