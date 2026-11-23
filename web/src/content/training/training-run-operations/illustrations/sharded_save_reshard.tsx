import {
    Board,
    CanvasItem,
    Panel,
    StackedBar,
    TextLabel,
    VectorArrow,
    getToneColor,
    getThemeColors,
} from 'vizmatic'
import { createElement } from 'react'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 640
export const height = 760
export const opaqueBackground = true
export const alt =
    'A global element-index axis from 0 through 16 stays fixed while ownership changes. Four source ranks own the half-open ranges [0,4), [4,8), [8,12), and [12,16). Eight target ranks own [0,2), [2,4), [4,6), [6,8), [8,10), [10,12), [12,14), and [14,16). Each source range maps to two adjacent target ranges with no gaps or overlap. This is a logical coordinate mapping; the reader may still deserialize larger source tensors into CPU memory, and physical I/O depends on the storage implementation.'

const sourceRanges = [
    { rank: 0, start: 0, end: 4, tone: 'blue' as const },
    { rank: 1, start: 4, end: 8, tone: 'cyan' as const },
    { rank: 2, start: 8, end: 12, tone: 'purple' as const },
    { rank: 3, start: 12, end: 16, tone: 'green' as const },
]

const destinationRanges = Array.from({ length: 8 }, (_, rank) => {
    const start = rank * 2
    const sourceRank = Math.floor(rank / 2)
    return {
        rank,
        start,
        end: start + 2,
        sourceRank,
        tone: sourceRanges[sourceRank].tone,
    }
})

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const plotLeft = 40
    const plotWidth = 560
    const destinationWidth = plotWidth / destinationRanges.length
    const toneColor = (tone: ToneName) => getToneColor(tone, c)

    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({
                x: 24,
                y: 18,
                width: 592,
                height: 42,
                children: TextLabel({
                    c,
                    text: 'Reshard by global coordinates',
                    fontSize: 31,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                    width: 592,
                }),
            }),
            CanvasItem({
                x: 24,
                y: 64,
                width: 592,
                height: 34,
                children: TextLabel({
                    c,
                    text: '4 saved ranks → 8 target ranks · same tensor',
                    fontSize: 24,
                    color: c.textSecondary,
                    align: 'center',
                    width: 592,
                }),
            }),
            CanvasItem({
                x: 40,
                y: 106,
                width: 560,
                height: 34,
                children: TextLabel({
                    c,
                    text: 'Saved layout · 4 ranks',
                    fontSize: 26,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                    width: 560,
                }),
            }),

            ...sourceRanges.map((source) =>
                CanvasItem({
                    x: plotLeft + source.rank * 140,
                    y: 142,
                    width: 140,
                    height: 112,
                    children: Panel({
                        c,
                        title: `R${source.rank}`,
                        titleFontSize: 24,
                        tone: source.tone,
                        padding: 8,
                        gap: 3,
                        width: 140,
                        height: 112,
                        align: 'center',
                        children: TextLabel({
                            c,
                            text: '[' + source.start + ',' + source.end + ')',
                            fontSize: 25,
                            color: c.textPrimary,
                            align: 'center',
                            width: 118,
                        }),
                    }),
                }),
            ),

            // The arrows align with the target intervals on one global axis.
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}` },
                    ...destinationRanges.map((destination) => {
                        const x = plotLeft + (destination.rank + 0.5) * destinationWidth
                        return VectorArrow({
                            key: destination.rank,
                            x1: x,
                            y1: 261,
                            x2: x,
                            y2: 378,
                            color: toneColor(destination.tone),
                            strokeWidth: 3.5,
                            arrowSize: 3.5,
                        })
                    }),
                ),
            }),

            ...destinationRanges.map((destination) =>
                CanvasItem({
                    x: plotLeft + destination.rank * destinationWidth,
                    y: 390,
                    width: destinationWidth,
                    height: 32,
                    children: TextLabel({
                        c,
                        text: `R${destination.rank}`,
                        fontSize: 24,
                        fontWeight: 700,
                        color: c.textPrimary,
                        align: 'center',
                        width: destinationWidth,
                    }),
                }),
            ),
            CanvasItem({
                x: plotLeft,
                y: 426,
                width: plotWidth,
                height: 72,
                children: StackedBar({
                    c,
                    width: plotWidth,
                    height: 72,
                    showLegend: false,
                    segments: destinationRanges.map((destination) => ({
                        label: `Target rank ${destination.rank}`,
                        value: 2,
                        color: toneColor(destination.tone),
                        valueLabel: '',
                    })),
                }),
            }),

            CanvasItem({
                x: 40,
                y: 518,
                width: 560,
                height: 34,
                children: TextLabel({
                    c,
                    text: 'Global element index · interval boundaries',
                    fontSize: 24,
                    color: c.textPrimary,
                    align: 'center',
                    width: 560,
                }),
            }),
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}` },
                    createElement('line', {
                        x1: plotLeft,
                        y1: 573,
                        x2: plotLeft + plotWidth,
                        y2: 573,
                        stroke: c.border,
                        strokeWidth: 3,
                    }),
                    ...Array.from({ length: 9 }, (_, tickIndex) => {
                        const x = plotLeft + tickIndex * destinationWidth
                        return createElement('line', {
                            key: tickIndex,
                            x1: x,
                            y1: 564,
                            x2: x,
                            y2: 583,
                            stroke: c.border,
                            strokeWidth: 3,
                        })
                    }),
                ),
            }),
            ...Array.from({ length: 9 }, (_, tickIndex) => {
                const x = plotLeft + tickIndex * destinationWidth
                return CanvasItem({
                    x: x - 20,
                    y: 582,
                    width: 40,
                    height: 32,
                    children: TextLabel({
                        c,
                        text: String(tickIndex * 2),
                        fontSize: 24,
                        color: c.textPrimary,
                        align: 'center',
                        width: 40,
                    }),
                })
            }),

            CanvasItem({
                x: 24,
                y: 620,
                width: 592,
                height: 36,
                children: TextLabel({
                    c,
                    text: 'One source range → two adjacent target ranges',
                    fontSize: 24,
                    color: c.textPrimary,
                    align: 'center',
                    width: 592,
                }),
            }),
            CanvasItem({
                x: 24,
                y: 658,
                width: 592,
                height: 34,
                children: TextLabel({
                    c,
                    text: 'Logical slices · physical I/O varies by storage.',
                    fontSize: 24,
                    color: c.textSecondary,
                    align: 'center',
                    width: 592,
                }),
            }),
            CanvasItem({
                x: 24,
                y: 694,
                width: 592,
                height: 34,
                children: TextLabel({
                    c,
                    text: 'CPU staging may load a larger source tensor.',
                    fontSize: 24,
                    color: c.textSecondary,
                    align: 'center',
                    width: 592,
                }),
            }),
        ],
    })
}

export default create('dark')
