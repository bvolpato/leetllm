import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Evaluation replay case and candidate prompt v18 enter parallel citation and groundedness checks. The promotion gate keeps production on v17 if checks fail, and promotes to v18 when all criteria pass.'

interface BoxItem {
    x: number
    y: number
    w: number
    h: number
    title: string
    detail: string
    sub: string
    tone: 'blue' | 'cyan' | 'purple' | 'warm' | 'green' | 'critical'
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)

    const boxes: BoxItem[] = [
        // Column 1: Replay Input
        {
            x: 25,
            y: 195,
            w: 175,
            h: 140,
            title: 'Replay Case',
            detail: 'eval_case_104',
            sub: 'Candidate prompt v18',
            tone: 'cyan',
        },

        // Column 2: Evaluators
        {
            x: 235,
            y: 120,
            w: 180,
            h: 120,
            title: 'Citation Check',
            detail: 'Rule-based regex',
            sub: 'Validates source links',
            tone: 'blue',
        },
        {
            x: 235,
            y: 280,
            w: 180,
            h: 120,
            title: 'Groundedness Judge',
            detail: 'LLM-as-a-judge',
            sub: 'Faithfulness score >= 0.85',
            tone: 'purple',
        },

        // Column 3: Quality Gate
        {
            x: 450,
            y: 195,
            w: 180,
            h: 140,
            title: 'Promotion Gate',
            detail: 'Threshold Check',
            sub: 'Aggregates evaluation runs',
            tone: 'warm',
        },

        // Column 4: Decisions
        {
            x: 665,
            y: 120,
            w: 170,
            h: 120,
            title: 'Promote v18',
            detail: 'Production Deploy',
            sub: 'All checks passed',
            tone: 'green',
        },
        {
            x: 665,
            y: 280,
            w: 170,
            h: 120,
            title: 'Retain v17',
            detail: 'Production Fallback',
            sub: 'Rejection on regression',
            tone: 'critical',
        },
    ]

    return Board({
        c,
        width,
        height,
        children: [
            // Background SVG elements and arrows
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Col 1 -> Col 2 */}
                        <VectorArrow
                            x1={200}
                            y1={240}
                            x2={235}
                            y2={180}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={200}
                            y1={290}
                            x2={235}
                            y2={340}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Col 2 -> Col 3 */}
                        <VectorArrow
                            x1={415}
                            y1={180}
                            x2={450}
                            y2={240}
                            color={tone('warm')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={415}
                            y1={340}
                            x2={450}
                            y2={290}
                            color={tone('warm')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Col 3 -> Col 4 */}
                        <VectorArrow
                            x1={630}
                            y1={240}
                            x2={665}
                            y2={180}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={630}
                            y1={290}
                            x2={665}
                            y2={340}
                            color={tone('critical')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {boxes.map((b) => (
                            <rect
                                key={b.title}
                                x={b.x}
                                y={b.y}
                                width={b.w}
                                height={b.h}
                                rx="8"
                                fill={fill(b.tone)}
                                stroke={tone(b.tone)}
                                strokeWidth="1.5"
                            />
                        ))}
                    </svg>
                ),
            }),

            // Header titles
            CanvasItem({
                x: 25,
                y: 20,
                width: 810,
                height: 32,
                children: (
                    <TextLabel
                        c={c}
                        text="Prompt Quality Evaluation and Promotion Loop"
                        width={810}
                        fontSize={22}
                        fontWeight={700}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 25,
                y: 55,
                width: 810,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Diagnostic evaluation replay with automated verification gates controlling production prompt rollout"
                        width={810}
                        fontSize={14}
                        fontWeight={400}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Box contents
            ...boxes.flatMap((b) => [
                CanvasItem({
                    x: b.x + 8,
                    y: b.y + 14,
                    width: b.w - 16,
                    height: 22,
                    children: (
                        <TextLabel
                            c={c}
                            text={b.title}
                            width={b.w - 16}
                            fontSize={14}
                            fontWeight={700}
                            color={tone(b.tone)}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: b.x + 8,
                    y: b.y + 40,
                    width: b.w - 16,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={b.detail}
                            width={b.w - 16}
                            fontSize={12}
                            fontWeight={600}
                            mono
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: b.x + 8,
                    y: b.y + 68,
                    width: b.w - 16,
                    height: 36,
                    children: (
                        <TextLabel
                            c={c}
                            text={b.sub}
                            width={b.w - 16}
                            fontSize={11}
                            color={c.textSecondary}
                            align="center"
                        />
                    ),
                }),
            ]),
        ],
    })
}

export default create()
