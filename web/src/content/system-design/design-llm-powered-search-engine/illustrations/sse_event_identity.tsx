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
    'Server-Sent Events (SSE) ID inheritance hazard and explicit sequence resolution. When a second frame omits an explicit ID, the browser retains the previous frame’s lastEventId (12), causing naive deduplication to discard the distinct checked_claim payload. Emitting monotonic explicit IDs (12, then 13) guarantees delivery and clean reconnect resumption.'

export const numericAnchors = {
    firstFrameId: 12,
    secondFrameMissingInheritedId: 12,
    secondFrameExplicitId: 13,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('critical', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 12,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem
            x={x}
            y={y}
            width={w}
            height={Math.min(
                height - y,
                Math.ceil(
                    fontSize *
                        1.4 *
                        Math.max(1, Math.ceil((text.length * fontSize * 0.55) / Math.max(w, 1))),
                ),
            )}
        >
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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <marker
                            id="sse-arr"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 8 5 L 0 9 z" fill={c.textMuted} />
                        </marker>
                    </defs>

                    {/* Left Column Box */}
                    <rect
                        x={40}
                        y={76}
                        width={370}
                        height={280}
                        rx={10}
                        fill={theme === 'dark' ? '#181214' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={106}
                        width={354}
                        height={54}
                        rx={6}
                        fill={theme === 'dark' ? '#241417' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={178}
                        width={354}
                        height={54}
                        rx={6}
                        fill={theme === 'dark' ? '#33161a' : '#fee2e2'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={258}
                        width={354}
                        height={76}
                        rx={6}
                        fill={theme === 'dark' ? '#3d1217' : '#fecaca'}
                        stroke={redTone}
                        strokeWidth={1.5}
                    />

                    {/* Left Arrows */}
                    <line
                        x1={225}
                        y1={160}
                        x2={225}
                        y2={178}
                        stroke={redTone}
                        strokeWidth={1.5}
                        markerEnd="url(#sse-arr)"
                    />
                    <line
                        x1={225}
                        y1={232}
                        x2={225}
                        y2={258}
                        stroke={redTone}
                        strokeWidth={1.5}
                        markerEnd="url(#sse-arr)"
                    />

                    {/* Right Column Box */}
                    <rect
                        x={450}
                        y={76}
                        width={370}
                        height={280}
                        rx={10}
                        fill={theme === 'dark' ? '#101d16' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={458}
                        y={106}
                        width={354}
                        height={54}
                        rx={6}
                        fill={theme === 'dark' ? '#162b1f' : '#ffffff'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={458}
                        y={178}
                        width={354}
                        height={54}
                        rx={6}
                        fill={theme === 'dark' ? '#1b3827' : '#dcfce7'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={458}
                        y={258}
                        width={354}
                        height={76}
                        rx={6}
                        fill={theme === 'dark' ? '#134024' : '#bbf7d0'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />

                    {/* Right Arrows */}
                    <line
                        x1={635}
                        y1={160}
                        x2={635}
                        y2={178}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        markerEnd="url(#sse-arr)"
                    />
                    <line
                        x1={635}
                        y1={232}
                        x2={635}
                        y2={258}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        markerEnd="url(#sse-arr)"
                    />

                    {/* Bottom Guidance Box */}
                    <rect
                        x={40}
                        y={372}
                        width={780}
                        height={90}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Server-Sent Events (SSE): ID Inheritance Trap & Client Deduplication',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Browser EventSource inherits previous event IDs on unlabelled frames, causing accidental drop of verified claims',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Column: ID Inheritance Hazard */}
            {label(
                40,
                84,
                370,
                'ANTIPATTERN: OMITTED ID INHERITANCE (SILENT LOSS)',
                11,
                redTone,
                'left',
                700,
            )}

            {/* Frame 1 Left */}
            {label(
                52,
                114,
                350,
                'Frame 1: id: 12 | data: {"type": "progress"}',
                12,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                52,
                134,
                350,
                'Browser callback: lastEventId = 12 (Accepted)',
                11,
                greenTone,
                'left',
                500,
            )}

            {/* Frame 2 Left */}
            {label(
                52,
                186,
                350,
                'Frame 2: (No id field) | data: {"type": "checked_claim"}',
                12,
                warmTone,
                'left',
                500,
            )}
            {label(
                52,
                206,
                350,
                'Browser callback: lastEventId = 12 (Inherited!)',
                11,
                redTone,
                'left',
                600,
            )}

            {/* Disaster result Left */}
            {label(52, 268, 350, 'Client Deduplication Failure: DROPPED', 13, redTone, 'left', 700)}
            {label(
                52,
                290,
                350,
                'Client sees lastEventId=12 already seen → Discards frame! Verified search claim is lost from the UI.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Column: Explicit Monotonic IDs */}
            {label(
                450,
                84,
                370,
                'CORRECT: EXPLICIT MONOTONIC IDS (ROBUST STREAM)',
                11,
                greenTone,
                'left',
                700,
            )}

            {/* Frame 1 Right */}
            {label(
                462,
                114,
                350,
                'Frame 1: id: 12 | data: {"type": "progress"}',
                12,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                462,
                134,
                350,
                'Browser callback: lastEventId = 12 (Accepted)',
                11,
                greenTone,
                'left',
                500,
            )}

            {/* Frame 2 Right */}
            {label(
                462,
                186,
                350,
                'Frame 2: id: 13 | data: {"type": "checked_claim"}',
                12,
                greenTone,
                'left',
                600,
            )}
            {label(
                462,
                206,
                350,
                'Browser callback: lastEventId = 13 (Distinct)',
                11,
                greenTone,
                'left',
                600,
            )}

            {/* Success result Right */}
            {label(462, 268, 350, 'Client Delivery & Replay: VERIFIED', 13, greenTone, 'left', 700)}
            {label(
                462,
                290,
                350,
                'Client receives both frames. On disconnect, browser automatically sends "Last-Event-ID: 13" for seamless replay.',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(52, 386, 756, 'Streaming Protocol Design Guidelines', 12, blueTone, 'left', 700)}
            {label(
                52,
                406,
                756,
                '1. Emit monotonic SSE event IDs. · 2. Embed JSON sequence numbers. · 3. Replay reconnects from last acknowledged sequence.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
