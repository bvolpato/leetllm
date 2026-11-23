import React from 'react'
import {
    Board,
    CanvasItem,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 1440
export const height = 800
export const alt =
    'The draft q remains [.40, .35, .25]. Top-2 truncation retains target masses .55 for noon and .30 for dawn, removes dusk at .15, then renormalizes .85 to p=[.6470588, .3529412, 0]. Raw acceptance factors (1, .857, .600) become (1, 1, 0), while q stays unchanged.'

type Colors = ReturnType<typeof getThemeColors>
const label = (
    c: Colors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 48,
    color = c.textPrimary,
    weight = 650,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 12}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
            <span
                style={{
                    color,
                    fontFamily: c.fontSans,
                    fontSize: size,
                    fontWeight: weight,
                    lineHeight: 1.05,
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </span>
        </div>
    </CanvasItem>
)
const center = (
    c: Colors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 48,
    color = c.textPrimary,
    weight = 650,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 12}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
            <span
                style={{
                    color,
                    fontFamily: c.fontSans,
                    fontSize: size,
                    fontWeight: weight,
                    lineHeight: 1.05,
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </span>
        </div>
    </CanvasItem>
)
const segmentColors = ['blue', 'green', 'warm'] as const
const names = ['noon', 'dawn', 'dusk']
const distributions = [
    { label: 'Draft q', values: [0.4, 0.35, 0.25], shown: ['.40', '.35', '.25'] },
    { label: 'Raw target', values: [0.55, 0.3, 0.15], shown: ['.55', '.30', '.15'] },
    {
        label: 'Top-2 target p',
        values: [0.55 / 0.85, 0.3 / 0.85, 0],
        shown: ['.6470588', '.3529412', ''],
    },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const colors = segmentColors.map((tone) => getReadableToneColor(tone, c, c.bg))
    const muted = c.textSecondary
    const chartX = 360
    const chartW = 1000
    const ys = [260, 380, 500]
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorArrow
                        x1={1130}
                        y1={438}
                        x2={1130}
                        y2={477}
                        color={getReadableToneColor('warm', c, c.bg)}
                        strokeWidth={6}
                        arrowSize={8}
                    />
                </svg>
            </CanvasItem>
            {label(c, 48, 20, 1335, 'Top-2 changes p and leaves q intact', 60, c.textPrimary, 800)}
            {label(
                c,
                50,
                94,
                1320,
                'Top-2 transforms the target p; the draft q stays as sampled.',
                48,
                muted,
                550,
            )}
            {names.map((name, i) => (
                <React.Fragment key={name}>
                    <CanvasItem x={54 + i * 340} y={170} width={44} height={34}>
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 8,
                                backgroundColor: colors[i],
                            }}
                        />
                    </CanvasItem>
                    {label(c, 110 + i * 340, 160, 230, name, 48, colors[i], 700)}
                </React.Fragment>
            ))}
            {distributions.map(({ label: rowLabel, values, shown }, row) => {
                const y = ys[row]
                let offset = 0
                const parts = values.map((value, i) => {
                    const item = (
                        <React.Fragment key={`${row}-${names[i]}`}>
                            {value > 0 && (
                                <CanvasItem
                                    x={chartX + offset * chartW}
                                    y={y}
                                    width={value * chartW}
                                    height={52}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: colors[i],
                                            borderRight: `3px solid ${c.bg}`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: c.bg,
                                                fontFamily: c.fontSans,
                                                fontSize: 48,
                                                fontWeight: 700,
                                                lineHeight: 1,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {shown[i]}
                                        </span>
                                    </div>
                                </CanvasItem>
                            )}
                        </React.Fragment>
                    )
                    offset += value
                    return item
                })
                return (
                    <React.Fragment key={rowLabel}>
                        {label(
                            c,
                            50,
                            y + 2,
                            290,
                            row === 2 ? 'Top-2 p' : rowLabel,
                            48,
                            row === 2 ? getReadableToneColor('critical', c, c.bg) : c.textPrimary,
                            700,
                        )}
                        {parts}
                    </React.Fragment>
                )
            })}
            {label(c, 360, 567, 970, 'Keep .55 + .30 = .85; divide by .85.', 48, muted, 600)}
            {label(c, 360, 632, 460, 'dusk p = 0', 48, getReadableToneColor('warm', c, c.bg), 700)}
            {label(
                c,
                50,
                720,
                290,
                'α raw → top-2',
                48,
                getReadableToneColor('green', c, c.bg),
                700,
            )}
            {center(c, 360, 720, 290, 'noon 1→1', 48, getReadableToneColor('blue', c, c.bg), 700)}
            {center(
                c,
                700,
                720,
                290,
                'dawn .857→1',
                48,
                getReadableToneColor('green', c, c.bg),
                700,
            )}
            {center(
                c,
                1040,
                720,
                330,
                'dusk .600→0',
                48,
                getReadableToneColor('warm', c, c.bg),
                700,
            )}
        </Board>
    )
}

export default create()
