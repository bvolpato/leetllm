import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'Algebraic route reversal using the earlier assumed model-service times. Let q be cold-worker wait and delta be the extra warm-worker wait. Cold completes at q plus 96 ms; warm at q plus delta plus 35 ms. A shared plot of extra wait delta from 0 to 100 ms shows warm rising from 35 to 135, crossing cold 96 at delta 61. Warm is earlier below 61; cold is earlier above 61. Region, residency and isolation eligibility precede route choice, and editor freshness still gates output.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const warmTone = getReadableToneColor('green', c, c.bg)
    const coldTone = getReadableToneColor('blue', c, c.bg)
    const crossTone = getReadableToneColor('warm', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    // Plot mapping: delta in [0, 100] -> x in [80, 450], time in [0, 150] -> y in [410, 130]
    const px = (d: number) => 80 + (d * 370) / 100
    const py = (t: number) => 410 - (t * 280) / 150

    const crossX = px(61)
    const crossY = py(96)

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Break-Even Plot */}
                    <rect
                        x={24}
                        y={60}
                        width={470}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Plot area */}
                    <rect
                        x={70}
                        y={110}
                        width={400}
                        height={310}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Shaded winning regions */}
                    {/* Green zone: delta <= 61 */}
                    <polygon
                        points={`${px(0)},${py(35)} ${crossX},${crossY} ${crossX},${py(96)} ${px(0)},${py(96)}`}
                        fill={warmTone}
                        opacity={0.15}
                    />
                    {/* Blue zone: delta > 61 */}
                    <polygon
                        points={`${crossX},${crossY} ${px(100)},${py(135)} ${px(100)},${py(96)}`}
                        fill={coldTone}
                        opacity={0.15}
                    />

                    {/* Cold flat line (96ms) */}
                    <line
                        x1={px(0)}
                        y1={py(96)}
                        x2={px(100)}
                        y2={py(96)}
                        stroke={coldTone}
                        strokeWidth={2.5}
                    />

                    {/* Warm line (35 + delta ms) */}
                    <line
                        x1={px(0)}
                        y1={py(35)}
                        x2={px(100)}
                        y2={py(135)}
                        stroke={warmTone}
                        strokeWidth={2.5}
                    />

                    {/* Crossover point dot and guidelines */}
                    <line
                        x1={crossX}
                        y1={py(96)}
                        x2={crossX}
                        y2={py(0)}
                        stroke={crossTone}
                        strokeWidth={1.2}
                        strokeDasharray="3 3"
                    />
                    <line
                        x1={px(0)}
                        y1={py(96)}
                        x2={crossX}
                        y2={py(96)}
                        stroke={crossTone}
                        strokeWidth={1.2}
                        strokeDasharray="3 3"
                    />
                    <circle cx={crossX} cy={crossY} r={6} fill={crossTone} />

                    {/* Plot Axes */}
                    <line
                        x1={px(0)}
                        y1={py(0)}
                        x2={px(100)}
                        y2={py(0)}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <line
                        x1={px(0)}
                        y1={py(0)}
                        x2={px(0)}
                        y2={py(150)}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Right: Decision Rules Panel */}
                    <rect
                        x={514}
                        y={60}
                        width={322}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Decision 1: delta < 61ms */}
                    <rect
                        x={526}
                        y={110}
                        width={298}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={warmTone}
                        strokeWidth={1.5}
                    />

                    {/* Decision 2: delta > 61ms */}
                    <rect
                        x={526}
                        y={225}
                        width={298}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={coldTone}
                        strokeWidth={1.5}
                    />

                    {/* Decision 3: Freshness gate */}
                    <rect
                        x={526}
                        y={340}
                        width={298}
                        height={120}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Cache Affinity vs Queue Wait · Break-Even Routing Decision Threshold',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                450,
                'Latency Trade-Off: Cold Worker vs Warm Cached Worker',
                16,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Y axis ticks */}
            {label(30, py(35) - 8, 35, '35ms', 10, warmTone, 'right')}
            {label(30, py(96) - 8, 35, '96ms', 10, coldTone, 'right', 600)}
            {label(30, py(135) - 8, 35, '135ms', 10, warmTone, 'right')}

            {/* X axis ticks */}
            {label(px(0) - 15, py(0) + 6, 30, '0', 10, c.textMuted, 'center')}
            {label(crossX - 25, py(0) + 6, 50, 'δ = 61ms', 10, crossTone, 'center', 700)}
            {label(px(100) - 15, py(0) + 6, 30, '100ms', 10, c.textMuted, 'center')}

            {/* Curve labels */}
            {label(px(12), py(45), 180, 'Warm: q + δ + 35 ms', 12, warmTone, 'left', 650)}
            {label(px(40), py(106), 180, 'Cold: q + 96 ms (Flat)', 12, coldTone, 'left', 650)}

            {/* Intersection callout */}
            {label(
                crossX - 100,
                crossY - 25,
                200,
                'Equal total time at δ = 61 ms',
                12,
                crossTone,
                'center',
                700,
            )}

            {label(70, 442, 400, 'Extra warm queue delay δ (ms) →', 12, c.textMuted, 'center')}

            {/* Right Header */}
            {label(526, 75, 298, 'Affinity Dispatch Rules', 16, c.textPrimary, 'left', 700)}

            {/* Rule 1 */}
            {label(538, 120, 274, 'When δ < 61 ms: Route to Warm', 13, warmTone, 'left', 700)}
            {label(538, 145, 274, '• Cache savings (61ms) exceed extra wait', 11, c.textMuted)}
            {label(
                538,
                165,
                274,
                '• Warm worker finishes first overall',
                11,
                warmTone,
                'left',
                600,
            )}
            {label(538, 185, 274, '• Saves host GPU prefill compute', 11, c.textMuted)}

            {/* Rule 2 */}
            {label(538, 235, 274, 'When δ > 61 ms: Route to Cold', 13, coldTone, 'left', 700)}
            {label(538, 260, 274, '• Warm queue wait exceeds prefill savings', 11, c.textMuted)}
            {label(
                538,
                280,
                274,
                '• Cold worker without cache finishes earlier!',
                11,
                coldTone,
                'left',
                600,
            )}
            {label(538, 300, 274, '• Sheds queue load from hot workers', 11, c.textMuted)}

            {/* Rule 3 */}
            {label(538, 350, 274, 'Editor Freshness Invariant', 13, c.textPrimary, 'left', 700)}
            {label(
                538,
                375,
                274,
                'Regardless of route chosen, candidate still checks captured snapshot S before client paint.',
                11,
                c.textMuted,
            )}
            {label(
                538,
                415,
                274,
                'Late responses from both paths drop safely.',
                11,
                c.textPrimary,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
