import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 370
export const alt =
    'Visual search-space contrast between HumanEval and SWE-bench. Left: HumanEval gives a single named function signature and docstring to implement (1 known target). Right: SWE-bench gives a GitHub issue inside a dense repository file map representing about 3,010 non-test files, highlighting roughly 1.7 target files that must be localized before patching.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const green = f.tone('green')
    const purple = f.tone('purple')
    const warm = f.tone('warm')

    // LEFT ZONE: HumanEval (named single-function target)
    const leftX = 16
    const leftW = 282
    f.rect(leftX, 18, leftW, 334, {
        fill: tint(blue, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 12,
    })
    f.text(leftX + 16, 40, 'HumanEval', { size: 17, weight: 700, color: blue })
    f.text(leftX + 16, 62, 'Target already named', { size: 13.5, color: c.textSecondary })

    // Single named function box
    f.rect(leftX + 20, 92, leftW - 40, 82, {
        fill: tint(blue, c.bg, 0.14),
        stroke: blue,
        strokeWidth: 1.7,
        radius: 9,
    })
    f.text(leftX + 34, 114, 'def mean(xs):', {
        size: 14.5,
        weight: 700,
        color: blue,
        mono: true,
    })
    f.text(leftX + 34, 138, '"""Return arithmetic mean."""', {
        size: 12.5,
        color: c.textSecondary,
        mono: true,
    })
    f.text(leftX + 34, 160, 'signature + docstring given', {
        size: 12,
        color: c.textMuted,
    })

    // Down arrow to single implementation
    f.arrow(leftX + leftW / 2, 174, leftX + leftW / 2, 214, {
        color: green,
        width: 1.8,
        head: 6,
    })

    f.rect(leftX + 20, 216, leftW - 40, 62, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.7,
        radius: 9,
    })
    f.text(leftX + leftW / 2, 238, 'Implementation', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
    })
    f.text(leftX + leftW / 2, 260, 'write 1 isolated function', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // Search scope badge
    f.rect(leftX + 40, 302, leftW - 80, 30, {
        fill: tint(blue, c.bg, 0.16),
        stroke: blue,
        strokeWidth: 1.2,
        radius: 15,
    })
    f.text(leftX + leftW / 2, 317, '1 / 1 target known', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // RIGHT ZONE: SWE-bench (dense repository search-space contrast)
    const rightX = 322
    const rightW = 462
    f.rect(rightX, 18, rightW, 334, {
        fill: tint(purple, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 12,
    })
    f.text(rightX + 18, 40, 'SWE-bench', { size: 17, weight: 700, color: purple })
    f.text(rightX + 18, 62, 'Localize fault across full repo before patching', {
        size: 13.5,
        color: c.textSecondary,
    })

    // Compact pipeline strip inside SWE-bench panel
    const stripY = 86
    const drawMiniChip = (x: number, w: number, label: string, tone: string) => {
        f.rect(x, stripY, w, 32, {
            fill: tint(tone, c.bg, 0.15),
            stroke: tone,
            strokeWidth: 1.4,
            radius: 7,
        })
        f.text(x + w / 2, stripY + 16, label, {
            size: 13.5,
            weight: 700,
            color: tone,
            align: 'center',
        })
    }
    drawMiniChip(rightX + 18, 122, 'Issue + repo', blue)
    f.arrow(rightX + 140, stripY + 16, rightX + 168, stripY + 16, { color: warm, width: 1.6, head: 5 })
    drawMiniChip(rightX + 170, 128, 'Localize files', warm)
    f.arrow(rightX + 298, stripY + 16, rightX + 326, stripY + 16, { color: green, width: 1.6, head: 5 })
    drawMiniChip(rightX + 328, 114, 'Patch diff', green)

    // Dense mini repository file-map (16 cols x 6 rows = 96 file tiles representing ~3,010 files)
    const mapX = rightX + 22
    const mapY = 156
    f.text(mapX, 138, 'Repository file map · ~3,010 non-test files', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
    })
    const cols = 16
    const rows = 6
    const tileW = 21
    const tileH = 15
    const gapX = 5
    const gapY = 5

    // Two adjacent highlighted target files (~1.7 avg edited files)
    const targetA = { r: 2, c: 9 }
    const targetB = { r: 3, c: 10 }

    for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
            const tx = mapX + col * (tileW + gapX)
            const ty = mapY + r * (tileH + gapY)
            const isTarget =
                (r === targetA.r && col === targetA.c) || (r === targetB.r && col === targetB.c)
            f.rect(tx, ty, tileW, tileH, {
                fill: isTarget ? warm : tint(c.textMuted, c.bg, 0.18),
                stroke: isTarget ? warm : c.borderSubtle,
                strokeWidth: isTarget ? 1.8 : 0.75,
                radius: 3,
            })
        }
    }

    // Highlight halo around target pair
    const hlX = mapX + targetA.c * (tileW + gapX) - 5
    const hlY = mapY + targetA.r * (tileH + gapY) - 5
    f.rect(hlX, hlY, tileW * 2 + gapX + 10, tileH * 2 + gapY + 10, {
        fill: 'none',
        stroke: warm,
        strokeWidth: 1.5,
        radius: 6,
    })

    // Callout from highlighted target tiles cleanly below the map
    const mapBot = mapY + rows * (tileH + gapY)
    f.callout(
        [hlX + tileW + 8, hlY + tileH * 2 + gapY + 6],
        [rightX + 216, mapBot + 24],
        '',
        {
            color: warm,
            bend: 0.16,
            head: 5,
        },
    )
    f.text(rightX + 216, mapBot + 38, '~1.7 target files edited (~32.8 lines)', {
        size: 14,
        weight: 700,
        color: warm,
        align: 'center',
    })

    return f.render()
}

export default create('dark')
