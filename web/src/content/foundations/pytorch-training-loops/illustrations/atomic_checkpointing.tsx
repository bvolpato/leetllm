import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 435
export const alt =
    'A resume archive groups model tensors, optimizer buffers, scheduler and scaler state, RNG state, and loader progress. A direct overwrite can leave the live checkpoint partial. In a same-directory staging save, the live checkpoint file remains intact while the temporary staging file is written and synced, then atomic os.replace points the live path to the new file.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const fillAmt = theme === 'dark' ? 0.15 : 0.09

    // ─── TOP BAND: RESUME ARCHIVE PAYLOAD ───
    fig.text(20, 20, 'Complete resume archive saved at an optimizer step boundary', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })
    const pills = [
        { label: 'W, b, buffers', w: 174 },
        { label: 'optimizer state', w: 178 },
        { label: 'lr / scaler / RNG', w: 186 },
        { label: 'loader cursor', w: 166 },
    ]
    let px = 20
    for (const p of pills) {
        fig.rect(px, 40, p.w, 36, {
            fill: tint(blue, c.bg, fillAmt),
            stroke: blue,
            strokeWidth: 1.4,
            radius: 8,
        })
        fig.text(px + p.w / 2, 58, p.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            mono: true,
            align: 'center',
        })
        px += p.w + 12
    }

    fig.line(20, 94, width - 20, 94, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // ─── LEFT COLUMN: DIRECT OVERWRITE (UNSAFE) ───
    fig.text(20, 118, 'Direct overwrite · unsafe', {
        size: 15,
        weight: 700,
        color: critical,
    })
    fig.text(20, 140, 'Writes directly over the live path', {
        size: 12.5,
        color: c.textSecondary,
    })

    // Live path pointer -> single corrupted inode
    fig.rect(20, 168, 126, 38, {
        fill: tint(critical, c.bg, 0.12),
        stroke: critical,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(83, 187, 'model-ckpt.pt', {
        size: 12.5,
        weight: 700,
        color: c.textPrimary,
        mono: true,
        align: 'center',
    })
    fig.arrow(148, 187, 192, 187, { color: critical, width: 2.2, head: 7 })

    // Partial byte-block strip showing crash mid-write
    const blkX = 198
    const blkY = 160
    const blkW = 160
    const blkH = 122
    fig.rect(blkX, blkY, blkW, blkH, {
        fill: tint(critical, c.bg, 0.08),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(blkX + 12, blkY + 18, 'live inode (partial)', {
        size: 13,
        weight: 700,
        color: critical,
    })
    // 4 byte rows: 2 written, 1 cut halfway by crash, 1 empty
    const widths = [132, 132, 62, 0]
    widths.forEach((w, i) => {
        const ry = blkY + 38 + i * 20
        fig.rect(blkX + 12, ry, 136, 11, {
            fill: tint(c.textMuted, c.bg, 0.14),
            radius: 3,
        })
        if (w > 0) {
            fig.rect(blkX + 12, ry, w, 11, {
                fill: i === 2 ? warm : critical,
                radius: 3,
            })
        }
    })
    // Red crash marker cutting row 2
    fig.line(blkX + 76, blkY + 72, blkX + 76, blkY + 114, {
        color: critical,
        width: 2.5,
        dash: '3 2',
    })
    fig.text(blkX + 82, blkY + 95, 'CRASH', {
        size: 13,
        weight: 800,
        color: critical,
    })

    // Consequence strip
    fig.rect(20, 314, 4, 88, { fill: critical, radius: 2 })
    fig.text(36, 330, 'Live file truncated mid-write', {
        size: 13.5,
        weight: 700,
        color: critical,
    })
    fig.text(36, 354, 'Previous good checkpoint is already gone.', {
        size: 12.5,
        color: c.textSecondary,
    })
    fig.text(36, 378, 'Restart fails on corrupt archive bytes.', {
        size: 12.5,
        color: c.textSecondary,
    })

    // Vertical divider
    fig.line(386, 110, 386, 412, { color: c.borderSubtle, width: 1 })

    // ─── RIGHT COLUMN: SAME-DIR STAGING + ATOMIC RENAME ───
    const rx = 410
    fig.text(rx, 118, 'Same-directory staging · atomic', {
        size: 15,
        weight: 700,
        color: green,
    })
    fig.text(rx, 140, 'Write .tmp + fsync, then swap directory entry', {
        size: 12.5,
        color: c.textSecondary,
    })

    // Live path name box
    fig.rect(rx, 168, 126, 38, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(rx + 63, 187, 'model-ckpt.pt', {
        size: 12.5,
        weight: 700,
        color: c.textPrimary,
        mono: true,
        align: 'center',
    })

    // Old intact inode (top right)
    const inX = rx + 186
    fig.rect(inX, 158, 162, 54, {
        fill: tint(blue, c.bg, 0.1),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(inX + 81, 176, 'old inode (intact)', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.rect(inX + 14, 192, 134, 9, { fill: blue, radius: 3 })

    // Dashed old pointer (active during step 1)
    fig.arrow(rx + 128, 180, inX - 4, 180, {
        color: blue,
        width: 1.8,
        dash: '4 3',
        head: 6,
    })
    fig.text(rx + 156, 162, 'step 1', { size: 13, color: blue, align: 'center' })

    // New staged .tmp inode (bottom right)
    fig.rect(inX, 234, 162, 66, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(inX + 81, 252, '1. .tmp + fsync()', {
        size: 13,
        weight: 700,
        color: purple,
        mono: true,
        align: 'center',
    })
    fig.rect(inX + 14, 268, 134, 9, { fill: green, radius: 3 })
    fig.rect(inX + 14, 282, 134, 9, { fill: green, radius: 3 })

    // Curved atomic os.replace() arrow swinging live pointer to new inode
    fig.path(`M${rx + 128} 194 C${rx + 158} 194, ${rx + 148} 266, ${inX - 10} 266`, {
        color: green,
        width: 2.6,
    })
    fig.arrow(inX - 16, 266, inX - 3, 266, { color: green, width: 2.6, head: 7 })
    fig.text(rx + 84, 246, '2. os.replace()', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
        align: 'center',
    })
    fig.text(rx + 84, 268, 'atomic swap', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Consequence strip
    fig.rect(rx, 314, 4, 88, { fill: green, radius: 2 })
    fig.text(rx + 16, 330, 'Crash during step 1 leaves live untouched', {
        size: 13.5,
        weight: 700,
        color: green,
    })
    fig.text(rx + 16, 354, 'Reader always sees complete old or complete new.', {
        size: 12.5,
        color: c.textSecondary,
    })
    fig.text(rx + 16, 378, 'Linux durability: fsync(parent_dir) after rename.', {
        size: 12.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
