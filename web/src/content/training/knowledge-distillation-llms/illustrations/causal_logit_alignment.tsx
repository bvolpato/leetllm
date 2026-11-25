import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 430
export const alt =
    'Four prefix positions t0 through t3 align teacher and student 4-logit vectors vertically for KL distillation over shared token IDs (0=7d, 1=3d, 2=30d, 3=never). Below, original labels [0, 0, 1, -100] shift left by one step to pair t0 with 0 (7d), t1 with 1 (3d), and t2 with -100 (masked out of both KL and cross-entropy loss), while t3 has no next label.'

const centers = [210, 345, 480, 615]
const colW = 110
const origLabels = ['0', '0', '1', '−100']
const shiftedTargets = [
    { top: '0 → 7d', tag: 'TRAIN', tone: 'green' as const },
    { top: '1 → 3d', tag: 'TRAIN', tone: 'green' as const },
    { top: '−100', tag: 'MASK (KL + CE)', tone: 'critical' as const },
    { top: 'none', tag: 'no next label', tone: 'muted' as const },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const teacher = fig.tone('cyan')
    const student = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const muted = c.textSecondary

    // Shared vocabulary strip at top
    fig.text(24, 24, 'Shared vocabulary', { size: 14, weight: 600, color: muted })
    const vocab = ['0 · 7d', '1 · 3d', '2 · 30d', '3 · never']
    vocab.forEach((v, i) => {
        const cx = centers[i]!
        fig.rect(cx - 52, 11, 104, 26, {
            fill: tint(c.textMuted, c.bg, 0.1),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 5,
        })
        fig.text(cx, 24, v, { size: 14, mono: true, weight: 600, align: 'center' })
    })

    // Column headers t0..t3
    const tHeaderY = 66
    centers.forEach((cx, i) => {
        fig.math(cx, tHeaderY, `t_${i}`, { size: 17, color: c.textPrimary, align: 'center' })
    })

    // Teacher & Student logit rows (same position t -> vertical KL alignment)
    const teacherY = 90
    const studentY = 172
    const boxH = 42

    fig.text(24, teacherY + boxH / 2, 'Teacher logits', {
        size: 15,
        weight: 600,
        color: teacher,
    })
    fig.text(24, studentY + boxH / 2, 'Student logits', {
        size: 15,
        weight: 600,
        color: student,
    })

    centers.forEach((cx, i) => {
        const isMasked = i === 2 || i === 3
        const op = isMasked ? 0.55 : 1
        fig.rect(cx - colW / 2, teacherY, colW, boxH, {
            fill: tint(teacher, c.bg, 0.16),
            stroke: teacher,
            strokeWidth: 1.5,
            radius: 7,
            opacity: op,
        })
        fig.text(cx, teacherY + boxH / 2, 'V = 4', {
            size: 15,
            mono: true,
            weight: 600,
            color: teacher,
            align: 'center',
        })

        fig.rect(cx - colW / 2, studentY, colW, boxH, {
            fill: tint(student, c.bg, 0.16),
            stroke: student,
            strokeWidth: 1.5,
            radius: 7,
            opacity: op,
        })
        fig.text(cx, studentY + boxH / 2, 'V = 4', {
            size: 15,
            mono: true,
            weight: 600,
            color: student,
            align: 'center',
        })

        // Same-position KL vertical connector
        const y1 = teacherY + boxH + 3
        const y2 = studentY - 3
        fig.line(cx, y1, cx, y2, {
            color: isMasked ? c.textMuted : c.textSecondary,
            width: 1.6,
            dash: isMasked ? '3 3' : undefined,
        })
        fig.circle(cx, y1, 3, { fill: isMasked ? c.textMuted : teacher })
        fig.circle(cx, y2, 3, { fill: isMasked ? c.textMuted : student })
        if (i === 0) {
            fig.text(cx + 12, (y1 + y2) / 2, 'same t', {
                size: 12,
                color: muted,
            })
        }
    })

    // Subtle divider between KL pairing and label shift
    fig.line(24, 234, width - 24, 234, { color: c.borderSubtle, width: 1 })

    // Original labels[j] row
    const origY = 264
    fig.text(24, origY + 20, 'labels[j]', {
        size: 15,
        mono: true,
        weight: 600,
        color: c.textPrimary,
    })
    centers.forEach((cx, j) => {
        fig.text(cx, origY - 12, `j = ${j}`, {
            size: 13,
            mono: true,
            color: muted,
            align: 'center',
        })
        const isIgn = j === 3
        fig.rect(cx - colW / 2, origY, colW, 38, {
            fill: isIgn ? tint(red, c.bg, 0.12) : tint(c.textMuted, c.bg, 0.08),
            stroke: isIgn ? red : c.border,
            strokeWidth: 1.25,
            radius: 6,
        })
        fig.text(cx, origY + 19, origLabels[j]!, {
            size: 15,
            mono: true,
            weight: 600,
            color: isIgn ? red : c.textPrimary,
            align: 'center',
        })
    })

    // Shifted targets row + diagonal shift arrows (j -> t = j-1)
    const targetY = 348
    const targetH = 56
    fig.text(24, targetY + targetH / 2, 'Shifted target', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    ;[1, 2, 3].forEach((j) => {
        const fromX = centers[j]!
        const toX = centers[j - 1]!
        const isMask = j === 3
        fig.arrow(fromX - 6, origY + 41, toX + 12, targetY - 4, {
            color: isMask ? red : green,
            width: 1.75,
            head: 7,
            dash: isMask ? '4 3' : undefined,
        })
    })

    shiftedTargets.forEach((item, i) => {
        const cx = centers[i]!
        const col = item.tone === 'green' ? green : item.tone === 'critical' ? red : muted
        fig.rect(cx - colW / 2, targetY, colW, targetH, {
            fill: item.tone === 'muted' ? 'none' : tint(col, c.bg, 0.14),
            stroke: item.tone === 'muted' ? c.borderSubtle : col,
            strokeWidth: item.tone === 'muted' ? 1 : 1.5,
            radius: 7,
        })
        fig.text(cx, targetY + 18, item.top, {
            size: 15,
            mono: true,
            weight: 700,
            color: item.tone === 'muted' ? muted : c.textPrimary,
            align: 'center',
        })
        fig.text(cx, targetY + 41, item.tag, {
            size: 12,
            weight: 600,
            color: col,
            align: 'center',
        })
    })

    fig.text(24, 418, 'labels[0] has no preceding logit; t3 has no next target.', {
        size: 13,
        color: muted,
    })

    return fig.render()
}

export default create('dark')
