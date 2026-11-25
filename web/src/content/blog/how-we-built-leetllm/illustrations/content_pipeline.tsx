import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 350
export const alt =
    'Horizontal dual-track convergence diagram. Top track: Git bundles flow through the content loader into canonical lessons. Bottom track: Supabase RLS user rows flow through scoped queries into personal study state. Both tracks remain isolated sources of truth and converge inside the Next.js Lesson Page.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const green = f.tone('green')

    const drawBox = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        detail: string,
        tone: string,
    ) => {
        f.rect(x, y, w, h, {
            fill: tint(tone, c.bg, 0.12),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 9,
        })
        f.text(x + w / 2, y + h * 0.36, title, {
            size: 15,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 12,
        })
        f.text(x + w / 2, y + h * 0.7, detail, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            width: w - 12,
        })
    }

    // Track 1: Git canonical content (top, y = 24..144)
    f.rect(14, 20, 566, 126, {
        fill: tint(blue, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 10,
    })
    f.text(28, 38, 'Canonical content · Git source of truth', {
        size: 13.5,
        weight: 700,
        color: blue,
    })
    drawBox(28, 58, 152, 72, 'Git bundles', 'reviewed source', blue)
    f.arrow(180, 94, 214, 94, { color: blue, width: 1.7, head: 6 })
    drawBox(216, 58, 158, 72, 'Content loader', 'text + assets', blue)
    f.arrow(374, 94, 408, 94, { color: blue, width: 1.7, head: 6 })
    drawBox(410, 58, 156, 72, 'Canonical lesson', 'shared artifact', blue)

    // Isolation barrier between tracks
    f.line(18, 174, 576, 174, { color: c.border, width: 1.25, dash: '5 5' })
    f.rect(182, 162, 234, 24, {
        fill: c.bg,
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 12,
    })
    f.text(299, 174, 'Isolated · user rows never write Git', {
        size: 12.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // Track 2: Supabase RLS user state (bottom, y = 200..326)
    f.rect(14, 202, 566, 126, {
        fill: tint(purple, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 10,
    })
    f.text(28, 220, 'Personal study state · Supabase RLS', {
        size: 13.5,
        weight: 700,
        color: purple,
    })
    drawBox(28, 240, 152, 72, 'Supabase rows', 'user-owned DB', purple)
    f.arrow(180, 276, 214, 276, { color: purple, width: 1.7, head: 6 })
    drawBox(216, 240, 158, 72, 'Scoped queries', 'auth.uid() RLS', purple)
    f.arrow(374, 276, 408, 276, { color: purple, width: 1.7, head: 6 })
    drawBox(410, 240, 156, 72, 'Personal state', 'progress + notes', purple)

    // Right convergence container: Next.js Lesson Page
    const pageX = 618
    const pageY = 38
    const pageW = 166
    const pageH = 274
    f.rect(pageX, pageY, pageW, pageH, {
        fill: tint(green, c.bg, 0.08),
        stroke: green,
        strokeWidth: 1.8,
        radius: 12,
    })
    f.text(pageX + pageW / 2, pageY + 26, 'Next.js', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
    })
    f.text(pageX + pageW / 2, pageY + 46, 'Lesson Page', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    // Composed slots inside Next.js Lesson Page
    f.rect(pageX + 14, pageY + 72, pageW - 28, 78, {
        fill: tint(blue, c.bg, 0.14),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 8,
    })
    f.text(pageX + pageW / 2, pageY + 99, 'Lesson prose', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'center',
    })
    f.text(pageX + pageW / 2, pageY + 123, 'same for all readers', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    f.rect(pageX + 14, pageY + 174, pageW - 28, 78, {
        fill: tint(purple, c.bg, 0.14),
        stroke: purple,
        strokeWidth: 1.3,
        radius: 8,
    })
    f.text(pageX + pageW / 2, pageY + 201, 'Reader overlay', {
        size: 13.5,
        weight: 700,
        color: purple,
        align: 'center',
    })
    f.text(pageX + pageW / 2, pageY + 225, 'bookmarks + notes', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Convergence arrows from tracks into Next.js Lesson Page slots
    f.arrow(566, 94, pageX + 12, pageY + 110, { color: blue, width: 1.8, head: 6 })
    f.arrow(566, 276, pageX + 12, pageY + 214, { color: purple, width: 1.8, head: 6 })

    return f.render()
}

export default create('dark')
