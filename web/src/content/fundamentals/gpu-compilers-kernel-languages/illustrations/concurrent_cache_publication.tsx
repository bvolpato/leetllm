import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'Top graph shows Writer A and Writer B each writing and closing a complete temporary file before executing atomic replace on key K. A reader opening K before the swap sees the complete old file; opening after sees the complete new file. Bottom pipeline shows an optional lock protocol: acquire lock, recheck exact key K, compile on miss, and publish before unlocking.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        tone: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(x + w / 2, y + h / 2 - 8, title, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 9, sub, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // === Top band: Atomic temp-file publication ===
    fig.text(24, 22, '1. Atomic temp-file publication prevents partial reads', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    // Left writers
    box(24, 52, 184, 52, 'Writer A', 'write + close temp A', blue)
    box(24, 134, 184, 52, 'Writer B', 'write + close temp B', cyan)

    // Center atomic swap node
    const swapX = 290
    const swapY = 92
    const swapW = 180
    const swapH = 54
    box(swapX, swapY, swapW, swapH, 'replace(K)', 'atomic inode swap', warm)

    // Curved converging arrows from Writer A & B
    fig.arrow(212, 78, swapX - 4, swapY + 18, { color: blue, width: 2, head: 6 })
    fig.arrow(212, 160, swapX - 4, swapY + 36, { color: cyan, width: 2, head: 6 })

    // Right readers (before vs after swap)
    box(552, 52, 184, 52, 'Open before swap', 'sees full old file', c.textSecondary)
    box(552, 134, 184, 52, 'Open after swap', 'sees full new file', green)

    fig.arrow(swapX + swapW + 4, swapY + 18, 548, 78, {
        color: c.textSecondary,
        width: 1.8,
        dash: '4 3',
        head: 5,
    })
    fig.arrow(swapX + swapW + 4, swapY + 36, 548, 160, { color: green, width: 2.2, head: 6 })

    fig.text(width / 2, 208, 'Readers never observe a half-written cache artifact for key K.', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // === Bottom band: Optional cooperating lock protocol ===
    const sepY = 234
    fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    fig.text(24, sepY + 24, '2. Cooperating lock reduces duplicate compiles across workers', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    const steps = [
        { title: '1. Lock K', sub: 'acquire mutex', tone: purple },
        { title: '2. Recheck K', sub: 'hit skips build', tone: cyan },
        { title: '3. Compile', sub: 'write temp file', tone: warm },
        { title: '4. Publish', sub: 'swap + unlock', tone: green },
    ]
    const sw = 158
    const sGap = 26
    const sY = sepY + 52
    steps.forEach((s, i) => {
        const sx = 24 + i * (sw + sGap)
        box(sx, sY, sw, 54, s.title, s.sub, s.tone)
        if (i < steps.length - 1) {
            fig.arrow(sx + sw + 3, sY + 27, sx + sw + sGap - 3, sY + 27, {
                color: s.tone,
                width: 2,
                head: 6,
            })
        }
    })

    fig.text(
        width / 2,
        366,
        'Locking avoids wasted compile work; atomic replace guarantees safety even without locks.',
        {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create('dark')
