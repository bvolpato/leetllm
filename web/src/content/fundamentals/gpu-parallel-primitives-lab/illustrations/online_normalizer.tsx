import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 420
export const alt =
    'Top band merges Chunk A [3, -1, 4, 1] (m=4, d=1.424404) rescaled by exp(4-6)=0.135335 with Chunk B [5, -9, 2, 6] (m=6, d=1.386195) into global m=6 and d=1.578968. Bottom left charts unscaled Chunk A (1.424), rescaled Chunk A (0.193), Chunk B (1.386), and merged d (1.579). Bottom right shows the proportional share split: 12.2% rescaled A and 87.8% Chunk B.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // === Top Band: Associative Softmax State Merge ===
    fig.text(24, 20, '1. Online softmax merge of Chunk A [3, -1, 4, 1] and Chunk B [5, -9, 2, 6]', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        line1: string,
        line2: string,
        tone: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, isLight ? 0.14 : 0.24),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(x + w / 2, y + 18, title, {
            size: 13,
            weight: 700,
            color: tone,
            align: 'center',
        })
        fig.text(x + w / 2, y + 40, line1, {
            size: 12,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        fig.text(x + w / 2, y + 58, line2, {
            size: 11.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const by = 44
    box(24, by, 204, 74, 'Chunk A', 'm_A = 4, d_A = 1.4244', '× exp(-2) = 0.1928', blue)
    fig.arrow(232, by + 37, 274, by + 37, { color: blue, width: 2, head: 6 })
    box(278, by, 204, 74, 'Chunk B', 'm_B = 6, d_B = 1.3862', '× exp(0) = 1.3862', green)
    fig.arrow(486, by + 37, 528, by + 37, { color: purple, width: 2, head: 6 })
    box(532, by, 204, 74, 'Merged (m, d)', 'm = max(4, 6) = 6', 'd = 1.578968', purple)

    // Rescale formula centered neatly below top flow
    fig.math(
        width / 2,
        142,
        'd = d_A\\,e^{m_A - m} + d_B\\,e^{m_B - m} = 1.4244\\,e^{-2} + 1.3862 = 1.5790',
        {
            size: 13.5,
            color: c.textPrimary,
            align: 'center',
        },
    )

    // Dividers
    fig.line(24, 168, width - 24, 168, { color: c.borderSubtle, width: 1 })
    fig.line(414, 182, 414, height - 20, { color: c.borderSubtle, width: 1 })

    // === Bottom Left: Unscaled vs Rescaled Normalizer Bars ===
    fig.text(24, 192, '2. Rescaling aligns Chunk A to m = 6', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 114
    const maxW = 216
    const maxV = 1.579
    const rows = [
        { label: 'Raw A', val: 1.424, text: '1.424', tone: c.textSecondary, dash: '4 3' },
        { label: 'Scaled A', val: 0.193, text: '0.193', tone: blue, dash: undefined },
        { label: 'Chunk B', val: 1.386, text: '1.386', tone: green, dash: undefined },
        { label: 'Merged d', val: 1.579, text: '1.579', tone: purple, dash: undefined },
    ]
    rows.forEach((r, i) => {
        const y = 224 + i * 44
        fig.text(24, y + 13, r.label, {
            size: 12.5,
            weight: i === 3 ? 700 : 600,
            color: i === 0 ? c.textSecondary : r.tone,
        })
        const w = (r.val / maxV) * maxW
        fig.rect(barX, y, w, 26, {
            fill: tint(r.tone, c.bg, isLight ? 0.22 : 0.36),
            stroke: r.tone,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(barX + w + 8, y + 13, r.text, {
            size: 12.5,
            weight: 700,
            color: r.tone,
            mono: true,
        })
    })

    // === Bottom Right: Proportional Share Split ===
    const rx = 438
    const rw = 298
    fig.text(rx, 192, '3. Share of merged d = 1.5790', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const shareY = 240
    const shareH = 44
    const aFrac = 0.192772 / 1.578968 // 0.1221
    const aW = rw * aFrac
    const bW = rw - aW - 3

    fig.rect(rx, shareY, aW, shareH, {
        fill: tint(blue, c.bg, isLight ? 0.26 : 0.42),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 5,
    })
    fig.rect(rx + aW + 3, shareY, bW, shareH, {
        fill: tint(green, c.bg, isLight ? 0.22 : 0.36),
        stroke: green,
        strokeWidth: 1.6,
        radius: 5,
    })

    fig.text(rx + aW + 3 + bW / 2, shareY + shareH / 2, 'Chunk B · 87.8%', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Clean callout for narrow 12.2% Chunk A sliver
    fig.callout([rx + aW / 2, shareY + shareH + 4], [rx + 66, shareY + shareH + 34], 'Scaled A · 12.2%', {
        color: blue,
        size: 12.5,
        weight: 700,
        bend: 0.15,
        align: 'left',
    })

    fig.text(rx, 350, 'Why rescaling matters:', { size: 12.5, weight: 700, color: warm })
    fig.text(rx, 372, 'Adding unscaled d_A + d_B double-counts', {
        size: 12,
        color: c.textSecondary,
    })
    fig.text(rx, 390, 'mismatched maxima (2.810 != 1.579).', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })

    return fig.render()
}

export default create('dark')
