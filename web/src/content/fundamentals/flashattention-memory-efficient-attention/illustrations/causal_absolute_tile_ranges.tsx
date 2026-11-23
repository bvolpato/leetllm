import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 740
export const alt =
    'A shared absolute-position axis compares query positions 128 through 255 with three key ranges. K tile 0 covers positions 0 through 127, entirely before every query. K tile 2 covers 128 through 191, so it includes keys earlier than some query rows and later than others and needs an elementwise causal mask. K tile 4 covers 256 through 319, entirely after every query. The example shows why unequal tile widths must be classified by position ranges instead of tile index.'

const trackX = 248
const trackW = 632
const px = (pos: number) => trackX + (pos / 320) * trackW

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const query = getReadableToneColor('purple', c, c.bg)
    const past = getReadableToneColor('green', c, c.bg)
    const boundary = getReadableToneColor('warm', c, c.bg)
    const future = getReadableToneColor('critical', c, c.bg)
    const fills = {
        query: getToneFill('purple', c),
        past: getToneFill('green', c),
        boundary: getToneFill('warm', c),
        future: getToneFill('critical', c),
    }

    const ticks = [0, 128, 192, 256, 320]
    const rows = [
        {
            label: 'Q1',
            range: '128–255',
            s: 128,
            e: 256,
            y: 162,
            tone: query,
            fill: fills.query,
            note: 'query tile',
        },
        {
            label: 'K0',
            range: '0–127',
            s: 0,
            e: 128,
            y: 248,
            tone: past,
            fill: fills.past,
            note: 'past · run',
        },
        {
            label: 'K2',
            range: '128–191',
            s: 128,
            e: 192,
            y: 334,
            tone: boundary,
            fill: fills.boundary,
            note: 'edge · mask',
        },
        {
            label: 'K4',
            range: '256–319',
            s: 256,
            e: 320,
            y: 420,
            tone: future,
            fill: fills.future,
            note: 'future · skip',
        },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={904}
                        height={446}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <VectorSegment
                        x1={px(0)}
                        y1={134}
                        x2={px(320)}
                        y2={134}
                        color={c.borderLight}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    {ticks.map((t) => (
                        <g key={t}>
                            <VectorSegment
                                x1={px(t)}
                                y1={126}
                                x2={px(t)}
                                y2={492}
                                color={c.borderSubtle}
                                strokeWidth={2}
                                showEndDot={false}
                            />
                        </g>
                    ))}
                    <VectorSegment
                        x1={px(128)}
                        y1={134}
                        x2={px(128)}
                        y2={492}
                        color={query}
                        strokeWidth={2}
                        opacity={0.85}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={px(256)}
                        y1={134}
                        x2={px(256)}
                        y2={492}
                        color={query}
                        strokeWidth={2}
                        opacity={0.85}
                        showEndDot={false}
                    />
                    {rows.map((r) => (
                        <g key={r.label}>
                            <SvgFrame
                                c={c}
                                x={px(r.s)}
                                y={r.y}
                                width={px(r.e) - px(r.s)}
                                height={58}
                                rx={10}
                                fill={r.fill}
                                stroke={r.tone}
                            />
                        </g>
                    ))}

                    <SvgFrame
                        c={c}
                        x={28}
                        y={528}
                        width={904}
                        height={194}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={12} width={width - 56} height={46}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 35,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Classify unequal tiles by absolute token range
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={84} width={180} height={36}>
                <span
                    style={{
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textSecondary,
                    }}
                >
                    TOKEN POS
                </span>
            </CanvasItem>
            {ticks.map((t) => (
                <CanvasItem key={t} x={px(t) - 42} y={80} width={84} height={36}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 700,
                                color: c.textSecondary,
                            }}
                        >
                            {t}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            {rows.map((r) => (
                <React.Fragment key={r.label}>
                    <CanvasItem x={48} y={r.y - 4} width={190} height={66}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 850,
                                    color: r.tone,
                                }}
                            >
                                {r.label}
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    color: c.textSecondary,
                                }}
                            >
                                {r.range}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={px(r.s)} y={r.y} width={px(r.e) - px(r.s)} height={58}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 800,
                                    color: r.tone,
                                }}
                            >
                                {r.e - r.s}t
                            </span>
                        </div>
                    </CanvasItem>
                </React.Fragment>
            ))}

            <CanvasItem x={48} y={542} width={864} height={166}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: past,
                        }}
                    >
                        K0 (0–127): all keys ≤ Q start → unmasked
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: boundary,
                        }}
                    >
                        K2 (128–191): overlaps Q1 (j &gt; i!) → mask
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: future,
                        }}
                    >
                        K4 (256–319): all keys &gt; Q end → skip
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create('dark')
