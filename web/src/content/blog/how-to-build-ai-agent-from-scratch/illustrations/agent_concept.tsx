import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 360
export const alt =
    'Horizontal cross-file reference graph. Service configs checkout.toml and reports.toml hold backend aliases (payments-primary and payments-archive) rather than URLs. Reverse lookup starts at retired billing-v1.example inside backends.toml, resolves payments-primary, and traces back to checkout.toml while leaving reports.toml unaffected.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const red = f.tone('critical')
    const warm = f.tone('warm')

    // Reverse lookup header track along top (steps 1 -> 2)
    const revY = 30
    f.path(`M656 108 V${revY} H212 V94`, {
        color: warm,
        width: 1.9,
        dash: '5 4',
    })
    f.arrow(212, 82, 212, 102, { color: warm, width: 1.9, head: 6 })

    // Reverse lookup pill badges on the top arc
    f.rect(482, revY - 13, 148, 26, {
        fill: tint(warm, c.bg, 0.2),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 13,
    })
    f.text(556, revY, '1. match retired URL', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })

    f.rect(264, revY - 13, 174, 26, {
        fill: tint(warm, c.bg, 0.2),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 13,
    })
    f.text(351, revY, '2. reverse-trace alias', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Left column: Service config files (no URLs!)
    f.text(18, 86, 'Service configs (aliases)', {
        size: 13.5,
        weight: 600,
        color: c.textSecondary,
    })

    // checkout.toml (affected)
    const s1 = { x: 18, y: 104, w: 238, h: 86 }
    f.rect(s1.x, s1.y, s1.w, s1.h, {
        fill: tint(blue, c.bg, 0.14),
        stroke: blue,
        strokeWidth: 1.9,
        radius: 10,
    })
    f.text(s1.x + 12, s1.y + 24, 'checkout.toml', {
        size: 16,
        weight: 700,
        color: blue,
        mono: true,
    })
    f.text(s1.x + 12, s1.y + 50, 'backend = "payments-primary"', {
        size: 12,
        color: c.textPrimary,
        mono: true,
        width: s1.w - 20,
    })
    // Affected badge
    f.rect(s1.x + 12, s1.y + 64, 72, 16, {
        fill: tint(red, c.bg, 0.2),
        radius: 4,
    })
    f.text(s1.x + 48, s1.y + 72, 'AFFECTED', {
        size: 11,
        weight: 700,
        color: red,
        align: 'center',
    })

    // reports.toml (unaffected)
    const s2 = { x: 18, y: 224, w: 238, h: 86 }
    f.rect(s2.x, s2.y, s2.w, s2.h, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 10,
    })
    f.text(s2.x + 12, s2.y + 24, 'reports.toml', {
        size: 16,
        weight: 600,
        color: c.textSecondary,
        mono: true,
    })
    f.text(s2.x + 12, s2.y + 50, 'backend = "payments-archive"', {
        size: 12,
        color: c.textSecondary,
        mono: true,
        width: s2.w - 20,
    })
    f.text(s2.x + 12, s2.y + 72, 'unaffected', {
        size: 12,
        color: c.textMuted,
    })

    // Right grouped region: backends.toml (contains both alias definitions and URLs)
    const bBox = { x: 312, y: 74, w: 472, h: 256 }
    f.rect(bBox.x, bBox.y, bBox.w, bBox.h, {
        fill: tint(purple, c.bg, 0.06),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 12,
    })
    f.text(bBox.x + 16, bBox.y + 22, 'backends.toml · only file containing endpoint URLs', {
        size: 14,
        weight: 700,
        color: purple,
    })

    // Row 1 inside backends.toml: payments-primary -> billing-v1.example
    const a1 = { x: 328, y: 112, w: 180, h: 74 }
    const u1 = { x: 556, y: 112, w: 212, h: 74 }
    f.rect(a1.x, a1.y, a1.w, a1.h, {
        fill: tint(purple, c.bg, 0.15),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 9,
    })
    f.text(a1.x + a1.w / 2, a1.y + 28, 'payments-primary', {
        size: 14.5,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })
    f.text(a1.x + a1.w / 2, a1.y + 52, 'alias key', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    f.rect(u1.x, u1.y, u1.w, u1.h, {
        fill: tint(red, c.bg, 0.16),
        stroke: red,
        strokeWidth: 1.9,
        radius: 9,
    })
    f.text(u1.x + u1.w / 2, u1.y + 28, 'billing-v1.example', {
        size: 14.5,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    f.text(u1.x + u1.w / 2, u1.y + 52, 'retired endpoint', {
        size: 12.5,
        weight: 600,
        color: red,
        align: 'center',
    })

    // Row 2 inside backends.toml: payments-archive -> billing-v2.example
    const a2 = { x: 328, y: 230, w: 180, h: 74 }
    const u2 = { x: 556, y: 230, w: 212, h: 74 }
    f.rect(a2.x, a2.y, a2.w, a2.h, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.3,
        radius: 9,
    })
    f.text(a2.x + a2.w / 2, a2.y + 28, 'payments-archive', {
        size: 14.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    f.text(a2.x + a2.w / 2, a2.y + 52, 'alias key', {
        size: 12.5,
        color: c.textMuted,
        align: 'center',
    })

    f.rect(u2.x, u2.y, u2.w, u2.h, {
        fill: tint(c.textMuted, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.3,
        radius: 9,
    })
    f.text(u2.x + u2.w / 2, u2.y + 28, 'billing-v2.example', {
        size: 14.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    f.text(u2.x + u2.w / 2, u2.y + 52, 'active endpoint', {
        size: 12.5,
        color: c.textMuted,
        align: 'center',
    })

    // Forward reference arrows
    f.arrow(s1.x + s1.w, s1.y + s1.h / 2, a1.x - 2, a1.y + a1.h / 2, {
        color: blue,
        width: 1.75,
        head: 6,
    })
    f.text((s1.x + s1.w + a1.x) / 2, s1.y + s1.h / 2 - 14, 'refs', {
        size: 12.5,
        color: blue,
        align: 'center',
    })
    f.arrow(a1.x + a1.w, a1.y + a1.h / 2, u1.x - 2, u1.y + u1.h / 2, {
        color: red,
        width: 1.75,
        head: 6,
    })

    f.arrow(s2.x + s2.w, s2.y + s2.h / 2, a2.x - 2, a2.y + a2.h / 2, {
        color: c.textMuted,
        width: 1.5,
        head: 6,
    })
    f.arrow(a2.x + a2.w, a2.y + a2.h / 2, u2.x - 2, u2.y + u2.h / 2, {
        color: c.textMuted,
        width: 1.5,
        head: 6,
    })

    return f.render()
}

export default create('dark')
