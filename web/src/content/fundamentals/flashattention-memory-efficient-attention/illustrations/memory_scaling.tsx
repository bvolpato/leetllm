import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    SvgFrame,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 780
export const alt =
    'Two aligned plots compare one FP16 score matrix and the FP32 row-wise LSE for batch 8 and 32 heads. At 4,096, 8,192, 12,288, and 16,384 tokens, score storage is 8, 32, 72, and 128 GiB; LSE storage is 4, 8, 12, and 16 MiB. The 8,192-token points are highlighted. Score storage grows quadratically; LSE grows linearly. The ratio compares only these arrays.'

const tokens = ['4K', '8K', '12K', '16K']
const scoresGiB = [8, 32, 72, 128]
const lseMiB = [4, 8, 12, 16]
const ratios = ['2,048×', '4,096×', '6,144×', '8,192×']
const xIdx = [0, 1, 2, 3]
const plotW = 860
const plotH = 190
const pad = 26
const xMin = -0.25
const xMax = 3.25
const px = (v: number) => 50 + pad + ((v - xMin) / (xMax - xMin)) * (plotW - 2 * pad)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('critical', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)

    const makePlot = (vals: number[], yMax: number, color: string) => (
        <AxisPlot
            c={c}
            width={plotW}
            height={plotH}
            padding={pad}
            xMin={xMin}
            xMax={xMax}
            yMin={0}
            yMax={yMax}
            showFrame={false}
            showAxes={true}
            showGrid={true}
            gridCount={4}
            vectors={vals.map((v, i) => ({
                x1: xIdx[i],
                y1: 0,
                x2: xIdx[i],
                y2: v,
                color: i === 1 ? warm : color,
                strokeWidth: 16,
                showStartDot: false,
                showEndDot: false,
            }))}
            paths={[{ points: vals.map((v, i) => ({ x: xIdx[i], y: v })), color, strokeWidth: 5 }]}
            points={vals.map((v, i) => ({
                x: xIdx[i],
                y: v,
                r: i === 1 ? 11 : 8,
                fill: i === 1 ? warm : color,
                stroke: c.bg,
                strokeWidth: 4,
            }))}
        />
    )

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={66}
                        width={904}
                        height={284}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={366}
                        width={904}
                        height={284}
                        rx={14}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={666}
                        width={904}
                        height={96}
                        rx={14}
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
                        Score matrix vs row LSE (B=8, H=32)
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={76} width={864} height={36}>
                <span style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: red }}>
                    FP16 SCORE MATRIX · QUADRATIC · GiB
                </span>
            </CanvasItem>
            <CanvasItem x={50} y={110} width={plotW} height={plotH}>
                {makePlot(scoresGiB, 136, red)}
            </CanvasItem>
            {scoresGiB.map((v, i) => (
                <CanvasItem key={v} x={px(i) - 78} y={302} width={156} height={36}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: i === 1 ? warm : red,
                            }}
                        >
                            {tokens[i]} {v}G
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={48} y={376} width={864} height={36}>
                <span
                    style={{ fontFamily: c.fontMono, fontSize: 30, fontWeight: 800, color: cyan }}
                >
                    FP32 ROW LSE · LINEAR · MiB
                </span>
            </CanvasItem>
            <CanvasItem x={50} y={410} width={plotW} height={plotH}>
                {makePlot(lseMiB, 17, cyan)}
            </CanvasItem>
            {lseMiB.map((v, i) => (
                <CanvasItem key={v} x={px(i) - 78} y={602} width={156} height={36}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: i === 1 ? warm : cyan,
                            }}
                        >
                            {tokens[i]} {v}M
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={48} y={674} width={864} height={34}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontFamily: c.fontSans, fontSize: 30, color: c.textSecondary }}>
                        P/LSE ratio (different units; Q, K, V, O excluded)
                    </span>
                </div>
            </CanvasItem>
            {ratios.map((r, i) => (
                <CanvasItem key={r} x={px(i) - 78} y={716} width={156} height={36}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontMono,
                                fontSize: 30,
                                fontWeight: 800,
                                color: warm,
                            }}
                        >
                            {r}
                        </span>
                    </div>
                </CanvasItem>
            ))}
        </Board>
    )
}

export default create('dark')
