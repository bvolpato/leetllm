import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 650
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'A supplied latency query uses a 0.5 relevance threshold. Serving scores 0.9 and opens its branch, where Cache scores 0.8 and Queue 0.7; both pass. Eval scores 0.1 and closes its branch, leaving Judges and Metrics unrated. In a counterfactual, Serving at 0.2 hides a supplied Cache score of 0.8 because the selector never reaches that child.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const admitted = getReadableToneColor('green', c, c.bg)
    const rejected = getReadableToneColor('critical', c, c.bg)
    const structural = getReadableToneColor('neutral', c, c.bg)
    const counterfactual = getReadableToneColor('purple', c, c.bg)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 20,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={fontWeight}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={20}
                        y={104}
                        width={240}
                        height={86}
                        rx={7}
                        fill={c.bgCard}
                        stroke={admitted}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={300}
                        y={104}
                        width={240}
                        height={86}
                        rx={7}
                        fill={c.bgCard}
                        stroke={rejected}
                        strokeWidth={2}
                    />

                    <SvgFrame
                        c={c}
                        x={18}
                        y={300}
                        width={112}
                        height={84}
                        rx={6}
                        fill={c.bgCard}
                        stroke={admitted}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={148}
                        y={300}
                        width={112}
                        height={84}
                        rx={6}
                        fill={c.bgCard}
                        stroke={admitted}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={300}
                        y={300}
                        width={112}
                        height={84}
                        rx={6}
                        fill={c.bgCard}
                        stroke={structural}
                        strokeWidth={1.5}
                        opacity={0.82}
                    />
                    <SvgFrame
                        c={c}
                        x={428}
                        y={300}
                        width={112}
                        height={84}
                        rx={6}
                        fill={c.bgCard}
                        stroke={structural}
                        strokeWidth={1.5}
                        opacity={0.82}
                    />

                    <VectorArrow
                        x1={140}
                        y1={192}
                        x2={74}
                        y2={286}
                        color={admitted}
                        strokeWidth={2.6}
                        arrowSize={5}
                    />
                    <VectorArrow
                        x1={140}
                        y1={192}
                        x2={204}
                        y2={286}
                        color={admitted}
                        strokeWidth={2.6}
                        arrowSize={5}
                    />

                    <path
                        d="M 420 192 L 360 229 M 420 192 L 480 229"
                        fill="none"
                        stroke={structural}
                        strokeWidth={2}
                        strokeDasharray="5 6"
                    />
                    <path
                        d="M 348 238 H 492"
                        fill="none"
                        stroke={rejected}
                        strokeWidth={5}
                        strokeLinecap="round"
                    />
                    <path
                        d="M 360 246 L 356 286 M 480 246 L 484 286"
                        fill="none"
                        stroke={structural}
                        strokeWidth={2}
                        strokeDasharray="4 6"
                        opacity={0.8}
                    />

                    <line x1={20} y1={415} x2={540} y2={415} stroke={c.border} strokeWidth={1.5} />

                    <SvgFrame
                        c={c}
                        x={18}
                        y={506}
                        width={188}
                        height={94}
                        rx={7}
                        fill={c.bgCard}
                        stroke={counterfactual}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={354}
                        y={506}
                        width={188}
                        height={94}
                        rx={7}
                        fill={c.bgCard}
                        stroke={structural}
                        strokeWidth={1.5}
                        opacity={0.9}
                    />
                    <path
                        d="M 206 552 H 263 M 297 552 H 354"
                        fill="none"
                        stroke={structural}
                        strokeWidth={2}
                        strokeDasharray="5 6"
                    />
                    <path
                        d="M 280 536 V 568"
                        fill="none"
                        stroke={rejected}
                        strokeWidth={5}
                        strokeLinecap="round"
                    />
                </svg>
            </CanvasItem>
            {label(20, 12, 520, 'Root scores gate child reports', 28, c.textPrimary, 'left', 700)}
            {label(20, 54, 520, 'Admit when query relevance ≥ 0.5', 21, c.textSecondary)}

            {label(26, 113, 228, 'Serving · level 0', 22, c.textPrimary, 'center', 700)}
            {label(26, 147, 228, '0.9 · pass', 22, admitted, 'center', 650)}
            {label(306, 113, 228, 'Eval · level 0', 22, c.textPrimary, 'center', 700)}
            {label(306, 147, 228, '0.1 · prune', 22, rejected, 'center', 650)}

            {label(18, 308, 112, 'Cache', 22, c.textPrimary, 'center', 700)}
            {label(18, 341, 112, '0.8 · pass', 20, admitted, 'center', 600)}
            {label(148, 308, 112, 'Queue', 22, c.textPrimary, 'center', 700)}
            {label(148, 341, 112, '0.7 · pass', 20, admitted, 'center', 600)}
            {label(300, 308, 112, 'Judges', 22, c.textPrimary, 'center', 700)}
            {label(300, 341, 112, 'unrated', 20, c.textSecondary, 'center', 600)}
            {label(428, 308, 112, 'Metrics', 22, c.textPrimary, 'center', 700)}
            {label(428, 341, 112, 'unrated', 20, c.textSecondary, 'center', 600)}

            {label(
                20,
                432,
                520,
                'Counterfactual · Serving falls below cutoff',
                21,
                counterfactual,
                'left',
                650,
            )}
            {label(24, 519, 176, 'Serving', 22, c.textPrimary, 'center', 700)}
            {label(22, 555, 180, '0.2 < 0.5 · skip', 20, rejected, 'center', 600)}
            {label(360, 519, 176, 'Cache', 22, c.textPrimary, 'center', 700)}
            {label(360, 555, 176, '0.8 if scored', 20, counterfactual, 'center', 600)}
        </Board>
    )
}

export default create('dark')
