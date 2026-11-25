import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Top band shows integer reduction shrinking 4,194,304 int32 inputs at 512 elements per block into 8,192 int64 partials, 16 partials, and 1 final sum. Bottom band shows the scan hierarchy threshold at 512^2 = 262,144 elements: 262,144 yields 512 block totals fitting one metadata block, while 262,145 (+1) yields 513 totals spanning 2 blocks and adding a recursion level.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    // === Top Band: Multi-Pass Reduction Narrowing (512x per level) ===
    fig.text(24, 22, '1. Multi-pass reduction narrows 512× per launch (int32 -> int64)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const levels = [
        { title: '4,194,304', sub: 'int32 inputs', h: 64, tone: c.textSecondary },
        { title: '8,192', sub: 'int64 partials', h: 52, tone: blue },
        { title: '16', sub: 'int64 partials', h: 42, tone: purple },
        { title: '1', sub: 'final total', h: 36, tone: green },
    ]
    const lx = 24
    const lw = 152
    const lGap = 34
    const centerY = 92

    levels.forEach((lv, i) => {
        const x = lx + i * (lw + lGap)
        const y = centerY - lv.h / 2
        fig.rect(x, y, lw, lv.h, {
            fill: tint(lv.tone, c.bg, isLight ? 0.16 : 0.28),
            stroke: lv.tone,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(x + lw / 2, centerY - 7, lv.title, {
            size: 14,
            weight: 700,
            color: i === 0 ? c.textPrimary : lv.tone,
            align: 'center',
            mono: true,
        })
        fig.text(x + lw / 2, centerY + 10, lv.sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
        })

        if (i < levels.length - 1) {
            fig.arrow(x + lw + 3, centerY, x + lw + lGap - 3, centerY, {
                color: lv.tone,
                width: 2,
                head: 6,
            })
            fig.text(x + lw + lGap / 2, centerY - 14, '÷512', {
                size: 11,
                weight: 700,
                color: c.textMuted,
                align: 'center',
                mono: true,
            })
        }
    })

    // === Bottom Band: Scan Recursion Boundary at 512^2 = 262,144 ===
    const sepY = 154
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    fig.text(24, sepY + 24, '2. Scan recursion boundary at 512² = 262,144 elements', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const drawRow = (
        y: number,
        tag: string,
        tagTone: string,
        nodes: Array<{ title: string; sub: string; tone: string }>,
    ) => {
        fig.text(24, y - 12, tag, { size: 13, weight: 700, color: tagTone })
        const nw = 208
        const nGap = 44
        nodes.forEach((n, i) => {
            const x = 24 + i * (nw + nGap)
            fig.rect(x, y, nw, 46, {
                fill: tint(n.tone, c.bg, isLight ? 0.15 : 0.26),
                stroke: n.tone,
                strokeWidth: 1.5,
                radius: 6,
            })
            fig.text(x + nw / 2, y + 16, n.title, {
                size: 13,
                weight: 700,
                color: n.tone,
                align: 'center',
                mono: true,
            })
            fig.text(x + nw / 2, y + 34, n.sub, {
                size: 11.5,
                color: c.textSecondary,
                align: 'center',
            })
            if (i < nodes.length - 1) {
                fig.arrow(x + nw + 4, y + 23, x + nw + nGap - 4, y + 23, {
                    color: n.tone,
                    width: 2,
                    head: 6,
                })
            }
        })
    }

    drawRow(224, 'N = 262,144  (fits in 1 metadata scan block)', green, [
        { title: '262,144 inputs', sub: '512 blocks × 512', tone: c.textSecondary },
        { title: '512 block totals', sub: 'exact block capacity', tone: blue },
        { title: '1 metadata block', sub: 'depth = 2 (no extra pass)', tone: green },
    ])

    drawRow(316, 'N = 262,145 (+1 element forces extra recursion level)', warm, [
        { title: '262,145 inputs', sub: '513 blocks (1-elem tail)', tone: warm },
        { title: '513 block totals', sub: 'overflows 512-slot block', tone: red },
        { title: '2 meta blocks', sub: '+1 recursion level (depth = 3)', tone: purple },
    ])

    return fig.render()
}

export default create('dark')
