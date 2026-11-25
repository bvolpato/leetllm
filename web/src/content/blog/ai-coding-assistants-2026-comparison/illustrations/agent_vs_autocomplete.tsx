import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 390
export const alt =
    'Three horizontal timeline swimlanes compare human-intervention cadence. Autocomplete runs short context-to-suggestion pulses where the human accepts every edit. A live agent receives a brief, performs multi-step work, and pauses at per-turn checkpoints for human steering. A delegated agent receives a scoped task brief, runs autonomously end to end, and hands back a diff and test log for final review.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const green = f.tone('green')
    const purple = f.tone('purple')
    const warm = f.tone('warm')

    const trackLeft = 206
    const trackRight = 772
    const trackW = trackRight - trackLeft
    const tx = (t: number) => trackLeft + t * trackW

    // Top axis header & legend
    f.text(18, 24, 'Operating mode', { size: 14, weight: 600, color: c.textSecondary })
    f.text(trackLeft, 24, 'Task timeline', { size: 14, weight: 600, color: c.textSecondary })

    // Legend swatches (top right)
    f.rect(504, 18, 22, 12, { fill: tint(blue, c.bg, 0.35), stroke: blue, strokeWidth: 1.5, radius: 3 })
    f.text(532, 24, 'Tool / agent work', { size: 13, color: c.textSecondary })
    const lgX = 656
    f.path(`M${lgX} 16 L${lgX + 8} 24 L${lgX} 32 L${lgX - 8} 24 Z`, {
        fill: warm,
        color: warm,
        width: 1,
    })
    f.text(lgX + 14, 24, 'Human intervenes', { size: 13, weight: 600, color: warm })

    // Subtle vertical time guide lines
    const topGuide = 48
    const botGuide = 354
    for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
        const x = tx(frac)
        f.line(x, topGuide, x, botGuide, {
            color: c.borderSubtle,
            width: 1,
            dash: frac === 0 || frac === 1 ? undefined : '3 4',
            opacity: frac === 0 || frac === 1 ? 0.8 : 0.65,
        })
    }
    f.text(tx(0), 372, 'Start', { size: 13, color: c.textMuted, align: 'left' })
    f.text(tx(0.5), 372, 'Active work', { size: 13, color: c.textMuted, align: 'center' })
    f.text(tx(1), 372, 'Merge / next', { size: 13, color: c.textMuted, align: 'right' })

    const drawDiamond = (cx: number, cy: number, r = 9) => {
        f.path(
            `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`,
            { fill: warm, color: c.bg, width: 1.5 },
        )
    }

    const drawWorkSpan = (
        x1: number,
        x2: number,
        cy: number,
        tone: string,
        label?: string,
        h = 30,
    ) => {
        f.rect(x1, cy - h / 2, x2 - x1, h, {
            fill: tint(tone, c.bg, 0.2),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 6,
        })
        if (label) {
            f.text((x1 + x2) / 2, cy, label, {
                size: 13.5,
                weight: 600,
                color: tone,
                align: 'center',
                width: x2 - x1 - 8,
            })
        }
    }

    // Swimlane rows
    const lanes = [
        { y: 98, name: 'Autocomplete', sub: 'Per-edit accept', tone: blue },
        { y: 202, name: 'Live agent', sub: 'Per-turn steer', tone: green },
        { y: 306, name: 'Delegated agent', sub: 'End diff review', tone: purple },
    ]

    lanes.forEach((lane, idx) => {
        // Subtle lane tint strip
        f.rect(14, lane.y - 44, width - 28, 88, {
            fill: tint(lane.tone, c.bg, 0.06),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 8,
        })
        // Left label accent bar
        f.rect(14, lane.y - 44, 4, 88, { fill: lane.tone, radius: 2 })
        f.text(28, lane.y - 12, lane.name, { size: 17, weight: 700, color: lane.tone })
        f.text(28, lane.y + 13, lane.sub, { size: 14, color: c.textSecondary })

        // Center timeline rail
        f.line(trackLeft + 4, lane.y, trackRight - 4, lane.y, {
            color: c.border,
            width: 1.5,
        })

        if (idx === 0) {
            // Autocomplete: 4 rapid edit-accept cycles
            const pulses = [
                [0.02, 0.18, 'ctx + edit'],
                [0.27, 0.43, 'suggest'],
                [0.52, 0.68, 'suggest'],
                [0.77, 0.93, 'suggest'],
            ] as const
            for (const [s, e, lbl] of pulses) {
                drawWorkSpan(tx(s), tx(e), lane.y, blue, lbl, 28)
            }
            for (const pt of [0.225, 0.475, 0.725, 0.975]) {
                drawDiamond(tx(pt), lane.y, 8.5)
                f.text(tx(pt), lane.y + 24, 'accept', {
                    size: 12.5,
                    weight: 600,
                    color: warm,
                    align: 'center',
                })
            }
            f.text(tx(0.1), lane.y - 25, 'file + cursor', {
                size: 12.5,
                color: c.textSecondary,
                align: 'center',
            })
        } else if (idx === 1) {
            // Live agent: brief -> work -> steer -> work -> inspect
            drawDiamond(tx(0.03), lane.y, 9)
            f.text(tx(0.03), lane.y + 25, 'brief', {
                size: 12.5,
                weight: 600,
                color: warm,
                align: 'center',
            })
            drawWorkSpan(tx(0.09), tx(0.45), lane.y, green, 'Search + edit route', 32)
            drawDiamond(tx(0.51), lane.y, 9)
            f.text(tx(0.51), lane.y + 25, 'steer turn', {
                size: 12.5,
                weight: 600,
                color: warm,
                align: 'center',
            })
            drawWorkSpan(tx(0.57), tx(0.91), lane.y, green, 'Run auth tests + fix', 32)
            drawDiamond(tx(0.97), lane.y, 9)
            f.text(tx(0.97), lane.y + 25, 'inspect', {
                size: 12.5,
                weight: 600,
                color: warm,
                align: 'center',
            })
            f.text(tx(0.27), lane.y - 26, 'workspace + expiry', {
                size: 12.5,
                color: c.textSecondary,
                align: 'center',
            })
        } else {
            // Delegated agent: task brief -> single long autonomous span -> diff review
            drawDiamond(tx(0.03), lane.y, 9)
            f.text(tx(0.03), lane.y + 25, 'task brief', {
                size: 12.5,
                weight: 600,
                color: warm,
                align: 'center',
            })
            drawWorkSpan(
                tx(0.1),
                tx(0.88),
                lane.y,
                purple,
                'Run scoped task autonomously (local or remote)',
                34,
            )
            drawDiamond(tx(0.95), lane.y, 9)
            f.text(tx(0.95), lane.y + 25, 'diff + log', {
                size: 12.5,
                weight: 600,
                color: warm,
                align: 'center',
            })
            f.text(tx(0.49), lane.y - 27, 'scope + checks fixed up front · review at handoff', {
                size: 12.5,
                color: c.textSecondary,
                align: 'center',
            })
        }
    })

    return f.render()
}

export default create('dark')
