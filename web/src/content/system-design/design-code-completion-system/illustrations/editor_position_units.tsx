import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 400
export const alt =
    'Three encoding tapes align on the character boundaries of a😀b where the emoji is U+1F600. Python uses 1 code point, UTF-16 uses surrogate pair D83D and DE00, and UTF-8 uses 4 bytes F0 9F 98 80. A vertical green caret before b aligns at Python index 2, UTF-16 offset 3, and UTF-8 byte 5. Slicing Python at UTF-16 offset 3 drops b, while cutting UTF-8 at byte 3 splits the 4-byte emoji in half.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    // Shared horizontal grid for "a" | U+1F600 | "b"
    // xStart = 175; 'a' width = 100; emoji width = 340 (4 x 82 + 3 x 4); 'b' width = 100
    const xA = 178
    const wA = 96
    const xE = 286
    const wE = 340
    const xB = 638
    const wB = 96
    const caretX = 632

    // Top source characters header
    fig.text(28, 42, 'Source string', { size: 14, weight: 700, color: c.textSecondary })
    fig.text(xA + wA / 2, 42, "'a'", {
        size: 18,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Draw vector smiley icon next to U+1F600 so it renders identically across fonts
    const ex = xE + wE / 2 - 52
    const ey = 42
    fig.circle(ex, ey, 13, { fill: tint(warm, c.bg, 0.25), stroke: warm, width: 1.8 })
    fig.circle(ex - 4.5, ey - 3, 1.8, { fill: warm })
    fig.circle(ex + 4.5, ey - 3, 1.8, { fill: warm })
    fig.path(`M${ex - 5.5} ${ey + 3} Q${ex} ${ey + 9},${ex + 5.5} ${ey + 3}`, {
        color: warm,
        width: 1.8,
    })
    fig.text(ex + 22, 42, 'U+1F600 (4 bytes)', {
        size: 15,
        weight: 700,
        color: warm,
        mono: true,
    })

    fig.text(xB + wB / 2, 42, "'b'", {
        size: 18,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Helper for tape cell
    const drawCell = (
        x: number,
        y: number,
        w: number,
        h: number,
        idxText: string,
        valText: string,
        tone: string,
        emphasis = false,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, emphasis ? 0.14 : 0.06),
            stroke: emphasis ? tone : c.border,
            strokeWidth: emphasis ? 1.5 : 1.1,
            radius: 6,
        })
        fig.text(x + w / 2, y + 15, idxText, {
            size: 12,
            color: c.textMuted,
            align: 'center',
            mono: true,
        })
        fig.text(x + w / 2, y + 35, valText, {
            size: 13,
            weight: 700,
            color: emphasis ? tone : c.textPrimary,
            align: 'center',
            mono: true,
        })
    }

    // Row 1: Python code points
    const y1 = 84
    fig.text(28, y1 + 17, 'Python', { size: 15, weight: 700, color: blue })
    fig.text(28, y1 + 36, 'code points', { size: 12, color: c.textSecondary })
    drawCell(xA, y1, wA, 50, '[0]', 'U+0061', blue)
    drawCell(xE, y1, wE, 50, '[1]', 'U+1F600 (1 code point)', blue, true)
    drawCell(xB, y1, wB, 50, '[2]', 'U+0062', blue)
    fig.text(750, y1 + 25, 'idx 2', { size: 14, weight: 700, color: green, mono: true })

    // Row 2: UTF-16 code units (VS Code / LSP)
    const y2 = 160
    fig.text(28, y2 + 17, 'UTF-16 (LSP)', { size: 15, weight: 700, color: purple })
    fig.text(28, y2 + 36, 'code units', { size: 12, color: c.textSecondary })
    drawCell(xA, y2, wA, 50, '[0]', '0x0061', purple)
    const w16 = (wE - 8) / 2
    drawCell(xE, y2, w16, 50, '[1] high', '0xD83D', purple, true)
    drawCell(xE + w16 + 8, y2, w16, 50, '[2] low', '0xDE00', purple, true)
    drawCell(xB, y2, wB, 50, '[3]', '0x0062', purple)
    fig.text(750, y2 + 25, 'off 3', { size: 14, weight: 700, color: green, mono: true })

    // Row 3: UTF-8 bytes
    const y3 = 236
    fig.text(28, y3 + 17, 'UTF-8', { size: 15, weight: 700, color: warm })
    fig.text(28, y3 + 36, 'bytes', { size: 12, color: c.textSecondary })
    drawCell(xA, y3, wA, 50, '[0]', '0x61', warm)
    const w8 = (wE - 18) / 4
    const bytes = ['F0', '9F', '98', '80']
    bytes.forEach((b, i) => {
        drawCell(xE + i * (w8 + 6), y3, w8, 50, `[${i + 1}]`, b, warm, true)
    })
    drawCell(xB, y3, wB, 50, '[5]', '0x62', warm)
    fig.text(750, y3 + 25, 'byte 5', { size: 14, weight: 700, color: green, mono: true })

    // Green valid caret line piercing all 3 tapes before 'b'
    fig.line(caretX, 66, caretX, 306, { color: green, width: 2.5 })
    fig.circle(caretX, 66, 4.5, { fill: green })
    fig.text(caretX, 322, "Valid caret before 'b' (Py 2 = UTF-16 3 = UTF-8 5)", {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Failure marker 1: Cutting UTF-8 at byte 3 (splits emoji between 9F and 98)
    const badUtf8X = xE + 2 * w8 + 9
    fig.line(badUtf8X, y3 - 6, badUtf8X, 356, { color: red, width: 2, dash: '4 3' })
    fig.callout(
        [badUtf8X, 352],
        [badUtf8X - 42, 366],
        'UTF-8 cut at byte 3 splits emoji (invalid UTF-8)',
        {
            color: red,
            labelColor: red,
            size: 13,
            weight: 600,
            align: 'right',
            bend: -0.15,
        },
    )

    // Failure marker 2: Using UTF-16 offset 3 directly in Python drops 'b' (kept cleanly at top-right!)
    const badPyX = xB + wB + 3
    fig.line(badPyX, y1 - 10, badPyX, y1 + 54, { color: red, width: 2, dash: '4 3' })
    fig.callout([badPyX, y1 - 8], [badPyX + 16, 42], 'Py[3:]', {
        color: red,
        labelColor: red,
        size: 13,
        weight: 700,
        align: 'left',
        bend: 0.15,
    })
    fig.text(badPyX + 22, 58, "drops 'b'", {
        size: 12,
        weight: 700,
        color: red,
        align: 'left',
    })

    return fig.render()
}

export default create('dark')
