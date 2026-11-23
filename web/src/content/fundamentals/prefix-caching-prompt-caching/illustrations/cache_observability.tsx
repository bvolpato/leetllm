import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 560
export const alt =
    'A binary hit counter counts both Request A (99.2% tokens cached, 5,952 of 6,000) and Request B (9.9% tokens cached, 592 of 6,000) as one hit. Separating token hit rates by prompt version shows guide-v6 at 99.2% dropping to 54.6% on guide-v7.'

const FONT = 26

interface MetricBarRow {
    y: number
    label: string
    pct: number
    detail: string
    color: string
}

function ObservabilityChart({ c }: { c: ThemeColors }) {
    const barX = 224
    const barMaxW = 356
    const rowsTop: MetricBarRow[] = [
        {
            y: 172,
            label: 'Req A (hit)',
            pct: 99.2,
            detail: '99.2% tokens',
            color: c.positiveLight,
        },
        {
            y: 228,
            label: 'Req B (hit)',
            pct: 9.9,
            detail: '9.9% tokens',
            color: c.warningLight,
        },
    ]
    const rowsBot: MetricBarRow[] = [
        {
            y: 394,
            label: 'guide-v6',
            pct: 99.2,
            detail: '99.2% (5,952)',
            color: c.primaryLight,
        },
        {
            y: 450,
            label: 'guide-v7',
            pct: 54.6,
            detail: '54.6% (3,276)',
            color: c.criticalLight,
        },
    ]

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={28} y={18} width={784} height={40}>
                <TextLabel
                    c={c}
                    text="Track token hit share, not binary hit flags"
                    fontSize={29}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={28} y={60} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="6,000 input tokens per request across two views"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={112}
                        width={784}
                        height={180}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={334}
                        width={784}
                        height={186}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    {[...rowsTop, ...rowsBot].map((row) => (
                        <React.Fragment key={`${row.label}-${row.y}`}>
                            <rect
                                x={barX}
                                y={row.y}
                                width={barMaxW}
                                height={34}
                                rx={6}
                                fill={c.bgSubtle}
                                stroke={c.border}
                                strokeWidth={1.2}
                            />
                            <rect
                                x={barX}
                                y={row.y}
                                width={Math.max(12, Math.round((row.pct / 100) * barMaxW))}
                                height={34}
                                rx={6}
                                fill={withColorAlpha(row.color, 0.35)}
                                stroke={row.color}
                                strokeWidth={2}
                            />
                        </React.Fragment>
                    ))}
                </svg>
            </CanvasItem>
            <CanvasItem x={48} y={124} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="Binary hit flag hides 10x token-reuse drop"
                    fontSize={FONT}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={48} y={346} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="Version tag isolates regression after guide-v7 edit"
                    fontSize={FONT}
                    fontWeight={700}
                />
            </CanvasItem>
            {[...rowsTop, ...rowsBot].map((row) => (
                <React.Fragment key={`${row.label}-${row.y}-lbl`}>
                    <CanvasItem x={48} y={row.y} width={166} height={34}>
                        <TextLabel c={c} text={row.label} fontSize={FONT} />
                    </CanvasItem>
                    <CanvasItem x={barX + barMaxW + 14} y={row.y} width={206} height={34}>
                        <TextLabel
                            c={c}
                            text={row.detail}
                            fontSize={FONT}
                            fontWeight={700}
                            color={row.color}
                        />
                    </CanvasItem>
                </React.Fragment>
            ))}
        </Board>
    )
}

const illustration = defineIllustration((c) => <ObservabilityChart c={c} />)

export const create = illustration.create
export default illustration.default
