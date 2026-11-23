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
    'MLflow lineage graph connects commit, dataset, and prompt versions to an experiment run, which tracks the logged model artifact and request traces for registry promotion and evaluation.'

interface NodeItem {
    x: number
    y: number
    w: number
    h: number
    title: string
    detail: string
    sub: string
    tone: 'blue' | 'cyan' | 'purple' | 'warm' | 'green'
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)

    const nodes: NodeItem[] = [
        // Column 1: Source Inputs
        {
            x: 25,
            y: 105,
            w: 175,
            h: 95,
            title: 'Git Commit',
            detail: '8b2f9e1',
            sub: 'Model & pipeline code',
            tone: 'blue',
        },
        {
            x: 25,
            y: 220,
            w: 175,
            h: 95,
            title: 'Dataset',
            detail: 'rag-eval-08',
            sub: 'Golden question set',
            tone: 'cyan',
        },
        {
            x: 25,
            y: 335,
            w: 175,
            h: 95,
            title: 'Prompt Template',
            detail: 'qa-answer-v17',
            sub: 'System instructions',
            tone: 'purple',
        },

        // Column 2: MLflow Run
        {
            x: 235,
            y: 195,
            w: 175,
            h: 145,
            title: 'MLflow Run',
            detail: 'run_id: 4f8b...',
            sub: 'Params, metrics, git tags',
            tone: 'warm',
        },

        // Column 3: Outputs
        {
            x: 445,
            y: 130,
            w: 180,
            h: 110,
            title: 'Logged Model',
            detail: 'model artifact',
            sub: 'Weights & MLmodel spec',
            tone: 'green',
        },
        {
            x: 445,
            y: 280,
            w: 180,
            h: 110,
            title: 'Trace ID',
            detail: 'request spans',
            sub: 'Latency & token IO',
            tone: 'blue',
        },

        // Column 4: Targets
        {
            x: 660,
            y: 130,
            w: 175,
            h: 110,
            title: 'Model Registry',
            detail: 'Version v3',
            sub: 'Production candidate',
            tone: 'green',
        },
        {
            x: 660,
            y: 280,
            w: 175,
            h: 110,
            title: 'Eval Case',
            detail: 'retrieval-case-42',
            sub: 'Diagnostic benchmark',
            tone: 'cyan',
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
                            y1={152}
                            x2={235}
                            y2={230}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={200}
                            y1={267}
                            x2={235}
                            y2={267}
                            color={tone('cyan')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={200}
                            y1={382}
                            x2={235}
                            y2={305}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Col 2 -> Col 3 */}
                        <VectorArrow
                            x1={410}
                            y1={235}
                            x2={445}
                            y2={185}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={410}
                            y1={295}
                            x2={445}
                            y2={335}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {/* Col 3 -> Col 4 */}
                        <VectorArrow
                            x1={625}
                            y1={185}
                            x2={660}
                            y2={185}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={625}
                            y1={335}
                            x2={660}
                            y2={335}
                            color={tone('cyan')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {nodes.map((n) => (
                            <rect
                                key={n.title + n.detail}
                                x={n.x}
                                y={n.y}
                                width={n.w}
                                height={n.h}
                                rx="8"
                                fill={fill(n.tone)}
                                stroke={tone(n.tone)}
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
                        text="MLflow End-to-End Lineage and Provenance Graph"
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
                        text="Tracks training artifacts, prompts, parameters, and execution traces from source inputs to model registry"
                        width={810}
                        fontSize={14}
                        fontWeight={400}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Node contents
            ...nodes.flatMap((n) => [
                CanvasItem({
                    x: n.x + 8,
                    y: n.y + 12,
                    width: n.w - 16,
                    height: 22,
                    children: (
                        <TextLabel
                            c={c}
                            text={n.title}
                            width={n.w - 16}
                            fontSize={14}
                            fontWeight={700}
                            color={tone(n.tone)}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: n.x + 8,
                    y: n.y + 36,
                    width: n.w - 16,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={n.detail}
                            width={n.w - 16}
                            fontSize={12}
                            fontWeight={600}
                            mono
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: n.x + 8,
                    y: n.y + 60,
                    width: n.w - 16,
                    height: 32,
                    children: (
                        <TextLabel
                            c={c}
                            text={n.sub}
                            width={n.w - 16}
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
