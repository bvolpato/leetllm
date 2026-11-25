import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 320
export const alt =
    'Horizontal build-time pipeline. One TSX illustration source passes through the Satori and Resvg raster builder to generate paired dark and light PNG previews (*_dark.png and *_light.png). The client renderer swaps between the two URLs by active theme without rebuilding on the server.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const green = f.tone('green')

    // Stage 1: Single .tsx
    const s1 = { x: 16, y: 108, w: 148, h: 104 }
    f.rect(s1.x, s1.y, s1.w, s1.h, {
        fill: tint(blue, c.bg, 0.13),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 10,
    })
    f.text(s1.x + s1.w / 2, s1.y + 30, 'Single .tsx', {
        size: 16,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })
    f.text(s1.x + s1.w / 2, s1.y + 56, 'Vizmatic source', {
        size: 13.5,
        color: c.textPrimary,
        align: 'center',
    })
    f.text(s1.x + s1.w / 2, s1.y + 80, 'create(theme)', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Stage 2: Satori + Resvg raster builder
    const s2 = { x: 204, y: 108, w: 154, h: 104 }
    f.arrow(s1.x + s1.w, 160, s2.x - 2, 160, { color: purple, width: 1.8, head: 6 })
    f.rect(s2.x, s2.y, s2.w, s2.h, {
        fill: tint(purple, c.bg, 0.13),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 10,
    })
    f.text(s2.x + s2.w / 2, s2.y + 30, 'Satori + Resvg', {
        size: 15.5,
        weight: 700,
        color: purple,
        align: 'center',
    })
    f.text(s2.x + s2.w / 2, s2.y + 56, 'Raster builder', {
        size: 13.5,
        color: c.textPrimary,
        align: 'center',
    })
    f.text(s2.x + s2.w / 2, s2.y + 80, 'build-time once', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    // Stage 3: Mini Dark & Light PNG previews (true dark/light mini cards)
    const pX = 408
    const pW = 164
    const pH = 112
    const darkY = 34
    const lightY = 174

    // Fork from builder to both previews
    const splitX = 382
    f.path(`M${s2.x + s2.w} 140 H${splitX} V${darkY + pH / 2} H${pX - 8}`, {
        color: purple,
        width: 1.7,
    })
    f.arrow(pX - 16, darkY + pH / 2, pX - 2, darkY + pH / 2, {
        color: purple,
        width: 1.7,
        head: 6,
    })

    f.path(`M${s2.x + s2.w} 180 H${splitX} V${lightY + pH / 2} H${pX - 8}`, {
        color: purple,
        width: 1.7,
    })
    f.arrow(pX - 16, lightY + pH / 2, pX - 2, lightY + pH / 2, {
        color: purple,
        width: 1.7,
        head: 6,
    })

    // Mini Dark PNG preview
    f.rect(pX, darkY, pW, pH, {
        fill: '#10141c',
        stroke: c.borderLight,
        strokeWidth: 1.5,
        radius: 9,
    })
    // Mini chart glyphs inside dark preview
    f.rect(pX + 14, darkY + 14, 136, 52, { fill: '#171d28', radius: 5 })
    f.rect(pX + 24, darkY + 42, 22, 18, { fill: '#4fa8e0', radius: 2 })
    f.rect(pX + 54, darkY + 30, 22, 30, { fill: '#7c6ff0', radius: 2 })
    f.rect(pX + 84, darkY + 22, 22, 38, { fill: '#4cc990', radius: 2 })
    f.rect(pX + 114, darkY + 34, 22, 26, { fill: '#e5a94c', radius: 2 })
    f.text(pX + pW / 2, darkY + 88, '*_dark.png', {
        size: 13.5,
        weight: 700,
        color: '#e6edf3',
        align: 'center',
        mono: true,
    })

    // Mini Light PNG preview
    f.rect(pX, lightY, pW, pH, {
        fill: '#fbf8f1',
        stroke: c.borderLight,
        strokeWidth: 1.5,
        radius: 9,
    })
    f.rect(pX + 14, lightY + 14, 136, 52, { fill: '#f1ece0', radius: 5 })
    f.rect(pX + 24, lightY + 42, 22, 18, { fill: '#0f4c5c', radius: 2 })
    f.rect(pX + 54, lightY + 30, 22, 30, { fill: '#6c4db0', radius: 2 })
    f.rect(pX + 84, lightY + 22, 22, 38, { fill: '#1f7a5a', radius: 2 })
    f.rect(pX + 114, lightY + 34, 22, 26, { fill: '#b07d24', radius: 2 })
    f.text(pX + pW / 2, lightY + 88, '*_light.png', {
        size: 13.5,
        weight: 700,
        color: '#1b222c',
        align: 'center',
        mono: true,
    })

    // Stage 4: Client theme swap
    const s4 = { x: 622, y: 102, w: 162, h: 116 }
    const joinX = 596
    f.path(`M${pX + pW} ${darkY + pH / 2} H${joinX} V144 H${s4.x - 8}`, {
        color: green,
        width: 1.7,
    })
    f.arrow(s4.x - 16, 144, s4.x - 2, 144, { color: green, width: 1.7, head: 6 })

    f.path(`M${pX + pW} ${lightY + pH / 2} H${joinX} V176 H${s4.x - 8}`, {
        color: green,
        width: 1.7,
    })
    f.arrow(s4.x - 16, 176, s4.x - 2, 176, { color: green, width: 1.7, head: 6 })

    f.rect(s4.x, s4.y, s4.w, s4.h, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.8,
        radius: 10,
    })
    f.text(s4.x + s4.w / 2, s4.y + 30, 'Client swap', {
        size: 16,
        weight: 700,
        color: green,
        align: 'center',
    })
    f.text(s4.x + s4.w / 2, s4.y + 58, 'Pick active URL', {
        size: 13.5,
        color: c.textPrimary,
        align: 'center',
    })
    f.text(s4.x + s4.w / 2, s4.y + 86, 'zero rebuild', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return f.render()
}

export default create('dark')
