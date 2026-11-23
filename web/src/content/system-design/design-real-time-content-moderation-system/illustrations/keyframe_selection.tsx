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
    'Video moderation adaptive keyframe extraction combining periodic temporal stride with scene-change detection. Along a 3-second timeline with 12 raw video frames, periodic sampling at 1 frame per second selects baseline frames at 0s, 1s, and 2s. A sudden visual scene cut between 1.25s and 1.5s triggers delta-based extraction for frame 6 and frame 10, capturing splice violations while reducing vision model compute by over 58 percent.'

export const numericAnchors = {
    rawFrames: 12,
    extractedKeyframes: 5,
    periodicStrideSeconds: 1.0,
    sceneChangeThreshold: 30,
    computeSavingsPercent: 58.3,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)

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

    // 12 raw frames with luminance values
    const frames = [
        { idx: 0, t: '0.0s', lum: 10, type: 'periodic' },
        { idx: 1, t: '0.25s', lum: 11, type: 'skip' },
        { idx: 2, t: '0.5s', lum: 12, type: 'skip' },
        { idx: 3, t: '0.75s', lum: 13, type: 'skip' },
        { idx: 4, t: '1.0s', lum: 15, type: 'periodic' },
        { idx: 5, t: '1.25s', lum: 16, type: 'skip' },
        { idx: 6, t: '1.5s', lum: 82, type: 'scene-cut' }, // delta = 66
        { idx: 7, t: '1.75s', lum: 84, type: 'skip' },
        { idx: 8, t: '2.0s', lum: 85, type: 'periodic' },
        { idx: 9, t: '2.25s', lum: 86, type: 'skip' },
        { idx: 10, t: '2.5s', lum: 18, type: 'scene-cut' }, // delta = 68
        { idx: 11, t: '2.75s', lum: 19, type: 'skip' },
    ]

    const plotLeft = 65
    const plotWidth = 360

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Timeline Panel */}
                    <rect
                        x={40}
                        y={70}
                        width={410}
                        height={262}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Timeline axis line */}
                    <line
                        x1={plotLeft - 10}
                        y1={250}
                        x2={plotLeft + plotWidth + 10}
                        y2={250}
                        stroke={stroke}
                        strokeWidth={2}
                    />

                    {/* Luminance curve connection */}
                    <path
                        d={frames
                            .map((f, i) => {
                                const x = plotLeft + (i * plotWidth) / 11
                                const y = 236 - (f.lum / 100) * 110
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                            })
                            .join(' ')}
                        fill="none"
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                    />

                    {/* 12 Frame points */}
                    {frames.map((f, i) => {
                        const x = plotLeft + (i * plotWidth) / 11
                        const y = 236 - (f.lum / 100) * 110

                        return (
                            <g key={i}>
                                {/* Drop line to axis */}
                                <line
                                    x1={x}
                                    y1={y}
                                    x2={x}
                                    y2={250}
                                    stroke={stroke}
                                    strokeWidth={1}
                                    strokeDasharray="2 2"
                                />

                                {f.type === 'periodic' ? (
                                    <rect
                                        x={x - 6}
                                        y={y - 6}
                                        width={12}
                                        height={12}
                                        rx={2}
                                        fill={blueTone}
                                    />
                                ) : f.type === 'scene-cut' ? (
                                    <polygon
                                        points={`${x},${y - 8} ${x + 7},${y + 5} ${x - 7},${y + 5}`}
                                        fill={warmTone}
                                    />
                                ) : (
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={4}
                                        fill={c.bgCard}
                                        stroke={c.textMuted}
                                        strokeWidth={1.5}
                                    />
                                )}
                            </g>
                        )
                    })}

                    {/* Right Panel */}
                    <rect
                        x={460}
                        y={70}
                        width={360}
                        height={262}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={40}
                        y={344}
                        width={780}
                        height={124}
                        rx={8}
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Video Moderation: Adaptive Keyframe Extraction',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Combining periodic baseline strides with visual delta triggers to detect fleeting splice violations',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Plot Header */}
            {label(
                40,
                80,
                400,
                'FRAME SEQUENCE & VISUAL DELTA TIMELINE (3 SECONDS)',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Frame Index labels below timeline */}
            {frames.map((f, i) => {
                const x = plotLeft + (i * plotWidth) / 11
                return (
                    <React.Fragment key={i}>
                        {label(x - 14, 256, 28, `F${f.idx}`, 9, c.textMuted, 'center', 500)}
                    </React.Fragment>
                )
            })}

            {/* Legend text */}
            {label(60, 286, 140, '■ Periodic (1 FPS)', 10, blueTone, 'left', 600)}
            <CanvasItem x={205} y={287} width={10} height={10}>
                <svg width={10} height={10} viewBox="0 0 10 10">
                    <polygon points="5,0 10,10 0,10" fill={warmTone} />
                </svg>
            </CanvasItem>
            {label(219, 286, 126, 'Scene-Cut (Δ > 30)', 10, warmTone, 'left', 600)}
            {label(350, 286, 90, '○ Skipped', 10, c.textMuted, 'left', 500)}

            {/* Right Panel: Extraction Strategy & Rules */}
            {label(472, 80, 340, 'ADAPTIVE KEYFRAME EXTRACTION LOGIC', 11, purpleTone, 'left', 700)}

            {label(472, 104, 340, '1. Periodic Baseline Stride (1.0s)', 12, blueTone, 'left', 700)}
            {label(
                472,
                122,
                340,
                'Fixed 1.0s interval selects Frames 0, 4, and 8. Guarantees uniform temporal coverage across long video streams.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                472,
                162,
                340,
                '2. Scene-Cut Delta Detector (Δ > 30)',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                472,
                180,
                340,
                'Sudden visual transitions trigger dynamic capture (Frame 6 at +66 delta, Frame 10 at -68 delta). Defeats sub-second splice attacks.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(472, 222, 340, '3. Compute Reduction Efficiency', 12, greenTone, 'left', 700)}
            {label(
                472,
                240,
                340,
                'Extracts 5 targeted keyframes instead of decoding 12 full frames, delivering a 58.3% reduction in vision model and OCR inference cost.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Invariant Panel */}
            {label(
                52,
                356,
                756,
                'Video Ingestion & Hardware Decoding Guardrails',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                380,
                756,
                '1. Upper Bound Clamping: A dynamic budget cap (e.g. max 45 frames per minute) protects downstream ML workers against strobe videos and rapid-cut DoS attacks. · 2. Audio Stream Decoupling: Audio tracks are demuxed and evaluated independently via streaming ASR speech-to-text and acoustic event models. · 3. Hardware Acceleration: Video demuxing and keyframe extraction run on hardware-accelerated NVDEC/QuickSync decoder pools to minimize CPU overhead.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
