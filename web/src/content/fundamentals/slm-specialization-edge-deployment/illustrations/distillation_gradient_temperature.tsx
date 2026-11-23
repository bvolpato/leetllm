import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 1280
export const height = 820
export const alt =
    'For teacher logits [4, 2, 1] and student logits [3.2, 2.4, 1.1], the first unscaled forward-KL gradient is −0.207576, −0.029854, and −0.000024 at temperatures 1, 3, and 100. On a second shared −0.30-to-0 axis, multiplying each gradient by temperature squared gives −0.207576, −0.268686, and −0.235045, with the high-temperature limit −0.233333. Bars extend left from zero to show negative derivative values; values remain temperature-dependent.'

const raw = [
    { tau: 1, value: -0.207576, scaled: -0.207576 },
    { tau: 3, value: -0.029854, scaled: -0.268686 },
    { tau: 100, value: -0.000024, scaled: -0.235045 },
]
const highTemperatureLimit = -0.233333
const displayGradient = (value: number) => value.toFixed(6).replace('-', '−').replace('0.', '.')

const label = (
    c: ReturnType<typeof getThemeColors>,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    fontSize = 42,
    fontWeight = 600,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
    math = false,
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={fontSize}
            fontWeight={fontWeight}
            color={color}
            align={align}
            math={math}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const structural = getReadableToneColor('neutral', c, c.bg)
    const rawColor = getReadableToneColor('warm', c, c.bg)
    const scaledColor = getReadableToneColor('blue', c, c.bg)
    const limitColor = getReadableToneColor('purple', c, c.bg)
    const rows = [320, 415, 510]
    const rawZero = 465
    const rawWidth = 315
    const scaledZero = 1010
    const scaledWidth = 300
    const xRaw = (value: number) => rawZero + (value / 0.3) * rawWidth
    const xScaled = (value: number) => scaledZero + (value / 0.3) * scaledWidth
    const limitX = xScaled(highTemperatureLimit)

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox="0 0 1280 820">
                    <path
                        d="M150 292 H465 M710 292 H1010"
                        stroke={structural}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    {[-0.3, -0.15, 0].map((tick) => {
                        const x1 = xRaw(tick)
                        const x2 = xScaled(tick)
                        return (
                            <g key={'tick-' + tick}>
                                <path
                                    d={'M' + x1 + ' 270 V536'}
                                    stroke={c.borderSubtle}
                                    strokeWidth="2"
                                    opacity="0.72"
                                />
                                <path
                                    d={'M' + x2 + ' 270 V536'}
                                    stroke={c.borderSubtle}
                                    strokeWidth="2"
                                    opacity="0.72"
                                />
                            </g>
                        )
                    })}
                    <path
                        d={'M' + limitX + ' 292 V486 M' + limitX + ' 534 V536'}
                        stroke={limitColor}
                        strokeWidth="4"
                        strokeDasharray="10 9"
                    />
                    {raw.map((item, index) => {
                        const y = rows[index]
                        const x1 = xRaw(item.value)
                        const x2 = xScaled(item.scaled)
                        return (
                            <g key={'tau-' + item.tau}>
                                <path
                                    d={'M' + rawZero + ' ' + y + ' H' + x1}
                                    stroke={rawColor}
                                    strokeWidth="22"
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx={x1}
                                    cy={y}
                                    r="12"
                                    fill={rawColor}
                                    stroke={c.bg}
                                    strokeWidth="4"
                                />
                                <path
                                    d={'M' + scaledZero + ' ' + y + ' H' + x2}
                                    stroke={scaledColor}
                                    strokeWidth="22"
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx={x2}
                                    cy={y}
                                    r="12"
                                    fill={scaledColor}
                                    stroke={c.bg}
                                    strokeWidth="4"
                                />
                            </g>
                        )
                    })}
                    <path d="M80 590 H1200" stroke={c.borderSubtle} strokeWidth="2" />
                    <path d="M80 708 H1200" stroke={c.borderSubtle} strokeWidth="2" />
                    <path
                        d="M195 668 H1080"
                        stroke={structural}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <path d="M1070 657 L1092 668 L1070 679 Z" fill={scaledColor} />
                </svg>
            </CanvasItem>
            {label(c, 40, 18, 1200, 56, 'Temperature changes the KL gradient scale', 50, 780)}
            {label(
                c,
                75,
                78,
                1130,
                50,
                '∂L/∂z_{s,i} = (p_{s,i} − p_{t,i}) / τ',
                46,
                620,
                c.textPrimary,
                'center',
                true,
            )}
            {label(
                c,
                70,
                132,
                1140,
                48,
                'Teacher [4,2,1] · student [3.2,2.4,1.1]',
                42,
                620,
                c.textMuted,
            )}
            {label(c, 10, 192, 102, 50, 'τ', 46, 760, c.textPrimary)}
            {label(c, 122, 192, 478, 50, 'Unscaled derivative', 46, 760, rawColor)}
            {label(c, 690, 192, 96, 50, 'τ', 46, 760, c.textPrimary)}
            {label(c, 790, 192, 420, 50, 'τ² × derivative', 46, 760, scaledColor)}
            {raw.map((item, index) => (
                <React.Fragment key={'labels-' + item.tau}>
                    {label(
                        c,
                        10,
                        rows[index] - 24,
                        102,
                        50,
                        String(item.tau),
                        42,
                        760,
                        c.textPrimary,
                        'right',
                    )}
                    {label(
                        c,
                        index === 2 ? 180 : 490,
                        rows[index] - 24,
                        index === 2 ? 260 : 210,
                        50,
                        displayGradient(item.value),
                        42,
                        730,
                        rawColor,
                        index === 2 ? 'right' : 'left',
                    )}
                    {label(
                        c,
                        1030,
                        rows[index] - 24,
                        230,
                        50,
                        displayGradient(item.scaled),
                        42,
                        730,
                        scaledColor,
                        'left',
                    )}
                </React.Fragment>
            ))}
            {label(c, xRaw(-0.3) - 60, 542, 120, 46, '−0.30', 42, 600, c.textMuted)}
            {label(c, xRaw(-0.15) - 60, 542, 120, 46, '−0.15', 42, 600, c.textMuted)}
            {label(c, xRaw(0) - 40, 542, 80, 46, '0', 42, 600, c.textMuted)}
            {label(c, xScaled(-0.3) - 60, 542, 120, 46, '−0.30', 42, 600, c.textMuted)}
            {label(c, xScaled(-0.15) - 60, 542, 120, 46, '−0.15', 42, 600, c.textMuted)}
            {label(c, xScaled(0) - 40, 542, 80, 46, '0', 42, 600, c.textMuted)}
            {label(c, 820, 242, 360, 42, 'τ→∞: −0.233333', 42, 720, limitColor)}
            {label(
                c,
                60,
                606,
                340,
                48,
                'p_{s} − p_{t} ∝ τ^{-1}',
                42,
                680,
                c.textPrimary,
                'center',
                true,
            )}
            {label(c, 408, 606, 44, 48, '×', 44, 780, scaledColor)}
            {label(c, 460, 606, 300, 48, 'chain rule 1/τ', 42, 680, c.textPrimary, 'center', true)}
            {label(c, 768, 606, 44, 48, '→', 44, 780, scaledColor)}
            {label(
                c,
                820,
                606,
                390,
                48,
                'gradient ∝ τ^{-2}',
                42,
                700,
                c.textPrimary,
                'center',
                true,
            )}
            {label(
                c,
                60,
                724,
                1160,
                50,
                'τ² offsets the high-τ trend; exact gradients still differ.',
                42,
                650,
                c.textMuted,
            )}
        </Board>
    )
}

export default create('dark')
