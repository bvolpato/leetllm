import React from 'react'
import { CanvasItem, TextLabel, VectorArrow, getReadableToneColor, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 660
export const height = 800
export const autoSize = false
export const alt =
    'A connected topology has prefill ranks P7:0 and P7:1 on the left and decode ranks D3:0 and D3:1 on the right. Vertical two-way collective links stay inside each group. Horizontal arrows carry one 1.25 GiB KV shard per corresponding rank. The first shard owns heads 0 through 3 and the second owns heads 4 through 7. Both span all 8,192 token positions, totaling 2.50 GiB under ideal KV-head sharding. A separate control lane reserves D3 for attempt 4 and assigns one stream owner.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const fill = (color: string) =>
        '#' +
        [1, 3, 5]
            .map((i) =>
                Math.round(
                    parseInt(c.bgCard.slice(i, i + 2), 16) * 0.84 +
                        parseInt(color.slice(i, i + 2), 16) * 0.16,
                )
                    .toString(16)
                    .padStart(2, '0'),
            )
            .join('')
    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        fontSize = 24,
        fontWeight = 600,
        color = c.textPrimary,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={40}>
            <div style={{ display: 'flex', width: w }}>
                {TextLabel({ c, text, width: w, fontSize, fontWeight, color, align: 'center' })}
            </div>
        </CanvasItem>
    )
    const rank = (name: string, x: number, y: number, color: string) => (
        <CanvasItem x={x} y={y} width={156} height={88}>
            <div
                style={{
                    display: 'flex',
                    width: 156,
                    height: 88,
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `3px solid ${color}`,
                    borderRadius: 12,
                    backgroundColor: fill(color),
                }}
            >
                {TextLabel({ c, text: name, fontSize: 30, fontWeight: 750, color: c.textPrimary })}
            </div>
        </CanvasItem>
    )
    const shard = (firstHead: number, y: number) => (
        <CanvasItem x={226} y={y} width={208} height={132}>
            <div
                style={{
                    display: 'flex',
                    width: 208,
                    height: 132,
                    border: `3px solid ${purple}`,
                    borderRadius: 10,
                    backgroundColor: fill(purple),
                }}
            >
                <CanvasItem x={10} y={10} width={182} height={40}>
                    <div style={{ display: 'flex', width: 182, justifyContent: 'center' }}>
                        {TextLabel({
                            c,
                            text: 'KV heads',
                            fontSize: 24,
                            fontWeight: 600,
                            color: c.textPrimary,
                        })}
                    </div>
                </CanvasItem>
                <CanvasItem x={12} y={46} width={182} height={40}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2, 3].map((head) => (
                            <div
                                key={head}
                                style={{
                                    display: 'flex',
                                    width: 42,
                                    height: 34,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: c.bgCard,
                                    border: `2px solid ${c.textSecondary}`,
                                }}
                            >
                                {TextLabel({
                                    c,
                                    text: String(firstHead + head),
                                    fontSize: 24,
                                    fontWeight: 600,
                                    color: c.textPrimary,
                                })}
                            </div>
                        ))}
                    </div>
                </CanvasItem>
                <CanvasItem x={10} y={90} width={182} height={40}>
                    <div style={{ display: 'flex', width: 182, justifyContent: 'center' }}>
                        {TextLabel({
                            c,
                            text: '1.25 GiB',
                            fontSize: 26,
                            fontWeight: 750,
                            color: c.textPrimary,
                        })}
                    </div>
                </CanvasItem>
            </div>
        </CanvasItem>
    )
    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) =>
        VectorArrow({ x1, y1, x2, y2, color, strokeWidth: 3.5, arrowSize: 4 })
    return (
        <div
            style={{
                display: 'flex',
                position: 'relative',
                width,
                height,
                fontFamily: c.fontSans,
                background: 'transparent',
            }}
        >
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg
                    aria-hidden="true"
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                >
                    {arrow(552, 112, 552, 150, warm)}
                    {[292, 552].map((y) => (
                        <g key={y}>
                            {arrow(190, y, 218, y, purple)}
                            {arrow(442, y, 470, y, purple)}
                        </g>
                    ))}
                    {arrow(34, 348, 34, 486, blue)}
                    {arrow(178, 486, 178, 348, blue)}
                    {arrow(482, 348, 482, 486, green)}
                    {arrow(626, 486, 626, 348, green)}
                </svg>
            </CanvasItem>
            <CanvasItem x={28} y={24} width={604} height={82}>
                <div
                    style={{
                        display: 'flex',
                        width: 604,
                        height: 82,
                        border: `3px solid ${warm}`,
                        borderRadius: 10,
                        backgroundColor: fill(warm),
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                    }}
                >
                    {TextLabel({
                        c,
                        text: 'Control: reserve D3 · attempt 4',
                        fontSize: 26,
                        fontWeight: 750,
                        color: c.textPrimary,
                    })}
                    {TextLabel({
                        c,
                        text: 'Assign one stream owner',
                        fontSize: 24,
                        color: c.textPrimary,
                    })}
                </div>
            </CanvasItem>
            {label('P7', 28, 148, 156, 28, 750)}
            {label('prefill', 28, 188, 156, 24, 600)}
            {label('D3', 476, 148, 156, 28, 750)}
            {label('decode', 476, 188, 156, 24, 600)}
            {label('Ideal TP=2', 226, 166, 208, 24, 700)}
            {rank('P7:0', 28, 248, blue)}
            {rank('D3:0', 476, 248, green)}
            {rank('P7:1', 28, 508, blue)}
            {rank('D3:1', 476, 508, green)}
            {shard(0, 226)}
            {shard(4, 486)}
            {label('collectives', 28, 403, 156, 24, 600, c.textPrimary)}
            {label('collectives', 476, 403, 156, 24, 600, c.textPrimary)}
            {label('Both shards span 8,192 token positions', 28, 650, 604, 26, 650)}
            <CanvasItem x={104} y={696} width={452} height={24}>
                <div style={{ display: 'flex', width: 452, height: 24 }}>
                    {Array.from({ length: 16 }, (_, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                width: 28.25,
                                height: 24,
                                border: `2px solid ${c.textSecondary}`,
                                backgroundColor: fill(purple),
                            }}
                        />
                    ))}
                </div>
            </CanvasItem>
            {label('0', 54, 690, 36, 24)}
            {label('8191', 566, 690, 66, 24)}
            {label('1.25 + 1.25 = 2.50 GiB', 28, 750, 604, 28, 750)}
        </div>
    )
}
export default create('dark')
