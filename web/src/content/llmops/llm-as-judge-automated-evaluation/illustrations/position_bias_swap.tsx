import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 430
export const alt =
    'Crossing swap-wire remapping shows how slot verdicts translate back to candidate IDs before reconciliation. In the top case, Run 1 votes B and Run 2 votes A, so both wires land on stepwise and accept stepwise as winner. In the bottom case, both runs vote slot B, splitting wires across stepwise and compact and flagging position bias for review.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')

    const soft = (hex: string, amount = 0.14) => tint(hex, c.bg, amount)
    const neutralFill = tint(c.textMuted, c.bg, 0.08)

    const drawSlotNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        slotTag: string,
        candLabel: string,
        toneHex: string | null,
    ) => {
        fig.rect(x, y, w, h, {
            fill: toneHex ? soft(toneHex, 0.16) : neutralFill,
            stroke: toneHex ?? c.borderLight,
            strokeWidth: toneHex ? 1.8 : 1.1,
            radius: 6,
        })
        fig.text(x + 12, y + h / 2, slotTag, {
            size: 13,
            weight: 700,
            color: toneHex ?? c.textMuted,
            mono: true,
        })
        fig.text(x + 42, y + h / 2, candLabel, {
            size: 14,
            weight: toneHex ? 700 : 500,
            color: toneHex ? c.textPrimary : c.textSecondary,
        })
    }

    const drawCandNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        name: string,
        votes: string,
        toneHex: string | null,
    ) => {
        fig.rect(x, y, w, h, {
            fill: toneHex ? soft(toneHex, 0.14) : neutralFill,
            stroke: toneHex ?? c.borderSubtle,
            strokeWidth: toneHex ? 1.6 : 1,
            radius: 7,
        })
        fig.text(x + w / 2, y + h / 2 - 9, name, {
            size: 14.5,
            weight: 700,
            color: toneHex ?? c.textSecondary,
            align: 'center',
            mono: true,
        })
        fig.text(x + w / 2, y + h / 2 + 10, votes, {
            size: 12.5,
            weight: 500,
            color: c.textSecondary,
            align: 'center',
        })
    }

    const drawWire = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        active: boolean,
    ) => {
        const mid = (x1 + x2) / 2
        fig.path(`M${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2 - 8} ${y2}`, {
            color,
            width: active ? 2.4 : 1.1,
            dash: active ? undefined : '4 4',
            opacity: active ? 1 : 0.45,
        })
        if (active) {
            fig.arrow(x2 - 12, y2, x2, y2, { color, width: 2.2, head: 6.5 })
        }
    }

    const drawOutcome = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        toneHex: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: soft(toneHex, 0.16),
            stroke: toneHex,
            strokeWidth: 2,
            radius: 9,
        })
        fig.text(x + w / 2, y + h / 2 - 11, title, {
            size: 15.5,
            weight: 700,
            color: toneHex,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 11, sub, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        })
    }

    const drawScenario = (
        y0: number,
        heading: string,
        headingColor: string,
        r1Vote: 'A' | 'B',
        r2Vote: 'A' | 'B',
        consistent: boolean,
    ) => {
        fig.text(18, y0, heading, { size: 15.5, weight: 700, color: headingColor })

        // Column captions (only on top scenario to stay clean)
        if (y0 < 50) {
            fig.text(104, y0 + 24, 'Presented slots', {
                size: 12.5,
                weight: 600,
                color: c.textMuted,
                align: 'center',
            })
            fig.text(448, y0 + 24, 'Candidate IDs', {
                size: 12.5,
                weight: 600,
                color: c.textMuted,
                align: 'center',
            })
            fig.text(678, y0 + 24, 'Reconciled', {
                size: 12.5,
                weight: 600,
                color: c.textMuted,
                align: 'center',
            })
        }

        const slotX = 96
        const slotW = 148
        const slotH = 30
        const yR1A = y0 + 38
        const yR1B = y0 + 72
        const yR2A = y0 + 116
        const yR2B = y0 + 150

        fig.text(18, (yR1A + yR1B + slotH) / 2 - 8, 'Run 1', {
            size: 14,
            weight: 700,
            color: c.textPrimary,
        })
        fig.text(18, (yR1A + yR1B + slotH) / 2 + 10, `Vote ${r1Vote}`, {
            size: 13,
            weight: 600,
            color: consistent ? blue : warm,
            mono: true,
        })

        fig.text(18, (yR2A + yR2B + slotH) / 2 - 8, 'Run 2', {
            size: 14,
            weight: 700,
            color: c.textPrimary,
        })
        fig.text(18, (yR2A + yR2B + slotH) / 2 + 10, `Vote ${r2Vote}`, {
            size: 13,
            weight: 600,
            color: consistent ? blue : red,
            mono: true,
        })

        const wireColor1 = consistent ? blue : warm
        const wireColor2 = consistent ? blue : red

        // Run 1: (A=compact, B=stepwise)
        drawSlotNode(slotX, yR1A, slotW, slotH, 'A', 'compact', r1Vote === 'A' ? wireColor1 : null)
        drawSlotNode(slotX, yR1B, slotW, slotH, 'B', 'stepwise', r1Vote === 'B' ? wireColor1 : null)
        // Run 2: (A=stepwise, B=compact)
        drawSlotNode(slotX, yR2A, slotW, slotH, 'A', 'stepwise', r2Vote === 'A' ? wireColor2 : null)
        drawSlotNode(slotX, yR2B, slotW, slotH, 'B', 'compact', r2Vote === 'B' ? wireColor2 : null)

        // Candidate ID boxes
        const candX = 384
        const candW = 128
        const candH = 52
        const yStep = y0 + 52
        const yComp = y0 + 122

        drawCandNode(
            candX,
            yStep,
            candW,
            candH,
            'stepwise',
            consistent ? '2 votes (B, A)' : '1 vote (Run 1: B)',
            consistent ? green : warm,
        )
        drawCandNode(
            candX,
            yComp,
            candW,
            candH,
            'compact',
            consistent ? '0 votes' : '1 vote (Run 2: B)',
            consistent ? null : red,
        )

        // Crossing wires: slot -> candidate ID
        const wireStart = slotX + slotW + 2
        const wireEnd = candX - 2

        // Inactive faint wires first (background)
        if (r1Vote !== 'A')
            drawWire(wireStart, yR1A + slotH / 2, wireEnd, yComp + 16, c.textMuted, false)
        if (r2Vote !== 'B')
            drawWire(wireStart, yR2B + slotH / 2, wireEnd, yComp + 36, c.textMuted, false)
        if (r1Vote !== 'B')
            drawWire(wireStart, yR1B + slotH / 2, wireEnd, yStep + 16, c.textMuted, false)
        if (r2Vote !== 'A')
            drawWire(wireStart, yR2A + slotH / 2, wireEnd, yStep + 36, c.textMuted, false)

        // Active wires foreground
        if (r1Vote === 'B')
            drawWire(wireStart, yR1B + slotH / 2, wireEnd, yStep + 18, wireColor1, true)
        if (r2Vote === 'A')
            drawWire(wireStart, yR2A + slotH / 2, wireEnd, yStep + 34, wireColor2, true)
        if (r2Vote === 'B')
            drawWire(wireStart, yR2B + slotH / 2, wireEnd, yComp + 30, wireColor2, true)

        // Outcome box
        const outX = 594
        const outW = 170
        const outH = 66
        const outY = y0 + 80

        if (consistent) {
            fig.arrow(candX + candW + 4, yStep + candH / 2, outX - 6, outY + outH / 2, {
                color: green,
                width: 2.2,
                head: 7,
            })
            drawOutcome(outX, outY, outW, outH, 'Winner: stepwise', 'Order-consistent', green)
        } else {
            const mx = (candX + candW + outX) / 2
            fig.path(
                `M${candX + candW + 4} ${yStep + candH / 2} C ${mx} ${yStep + candH / 2}, ${mx} ${outY + 24}, ${outX - 10} ${outY + 24}`,
                { color: warm, width: 2, dash: '5 3' },
            )
            fig.path(
                `M${candX + candW + 4} ${yComp + candH / 2} C ${mx} ${yComp + candH / 2}, ${mx} ${outY + 42}, ${outX - 10} ${outY + 42}`,
                { color: red, width: 2, dash: '5 3' },
            )
            fig.arrow(outX - 16, outY + 24, outX - 4, outY + 24, {
                color: warm,
                width: 2,
                head: 6,
            })
            fig.arrow(outX - 16, outY + 42, outX - 4, outY + 42, {
                color: red,
                width: 2,
                head: 6,
            })
            drawOutcome(outX, outY, outW, outH, 'Unresolved', 'Slot B bias -> review', red)
        }
    }

    drawScenario(18, 'Case 1: Order-consistent preference (B then A)', green, 'B', 'A', true)
    fig.line(18, 214, width - 18, 214, { color: c.borderLight, width: 1, dash: '5 4' })
    drawScenario(234, 'Case 2: Slot-dependent flip (B then B)', red, 'B', 'B', false)

    return fig.render()
}

export default create('dark')
