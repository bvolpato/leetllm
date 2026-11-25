import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 350
export const alt =
    'Horizontal two-zone SWE-bench workflow. In the visible agent zone, an issue and pre-fix repository enter a cyclic repair loop of search and reproduce, localize and patch, and visible tests with evidence-led retries while budget remains. Crossing the submission divider passes the chosen patch to the hidden harness for final F2P and P2P grading.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const warm = f.tone('warm')
    const green = f.tone('green')

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        detail: string,
        tone: string,
    ) => {
        f.rect(x, y, w, h, {
            fill: tint(tone, c.bg, 0.13),
            stroke: tone,
            strokeWidth: 1.65,
            radius: 9,
        })
        f.text(x + w / 2, y + h * 0.36, title, {
            size: 14.5,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 12,
        })
        f.text(x + w / 2, y + h * 0.7, detail, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
            width: w - 12,
        })
    }

    // Zone 1 (Left): Visible Agent Repair Loop
    f.rect(14, 18, 514, 314, {
        fill: tint(blue, c.bg, 0.04),
        stroke: c.borderSubtle,
        strokeWidth: 1.25,
        radius: 12,
    })
    f.text(28, 38, 'Visible agent workspace · budgeted repair loop', {
        size: 14,
        weight: 700,
        color: blue,
    })

    // Zone 2 (Right): Hidden Evaluation Harness
    f.rect(606, 18, 180, 314, {
        fill: tint(green, c.bg, 0.07),
        stroke: green,
        strokeWidth: 1.5,
        radius: 12,
    })
    f.text(696, 38, 'Hidden harness', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Vertical submission divider between zones
    const divX = 567
    f.line(divX, 20, divX, 330, { color: green, width: 1.75, dash: '5 5' })

    // Nodes in Visible Zone
    const nIssue = { x: 26, y: 82, w: 126, h: 76 }
    const nSearch = { x: 184, y: 82, w: 146, h: 76 }
    const nPatch = { x: 362, y: 82, w: 150, h: 76 }
    const nVis = { x: 274, y: 214, w: 164, h: 76 }

    // Nodes in Hidden Zone
    const nEval = { x: 622, y: 92, w: 148, h: 86 }
    const nGrade = { x: 622, y: 224, w: 148, h: 70 }

    // Forward flow arrows inside Visible Zone
    f.arrow(nIssue.x + nIssue.w, 120, nSearch.x - 2, 120, { color: blue, width: 1.75, head: 6 })
    f.arrow(nSearch.x + nSearch.w, 120, nPatch.x - 2, 120, { color: purple, width: 1.75, head: 6 })

    // Patch -> Visible tests (clean right-side elbow well clear of nVis right edge)
    const elbowX = nPatch.x + nPatch.w - 28
    f.path(`M${elbowX} ${nPatch.y + nPatch.h} V252 H${nVis.x + nVis.w + 8}`, {
        color: warm,
        width: 1.75,
    })
    f.arrow(nVis.x + nVis.w + 18, 252, nVis.x + nVis.w + 2, 252, {
        color: warm,
        width: 1.75,
        head: 6,
    })

    // Retry feedback loop: Visible tests -> Search + reproduce
    f.path(`M${nVis.x} 252 H${nSearch.x + nSearch.w / 2} V${nSearch.y + nSearch.h + 8}`, {
        color: warm,
        width: 1.75,
        dash: '5 4',
    })
    f.arrow(
        nSearch.x + nSearch.w / 2,
        nSearch.y + nSearch.h + 18,
        nSearch.x + nSearch.w / 2,
        nSearch.y + nSearch.h + 2,
        { color: warm, width: 1.75, head: 6 },
    )
    f.rect(178, 240, 82, 24, {
        fill: tint(warm, c.bg, 0.2),
        stroke: warm,
        strokeWidth: 1.2,
        radius: 12,
    })
    f.text(219, 252, 'retry loop', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Submit patch crossing divider into Hidden harness
    f.path(`M${nVis.x + nVis.w / 2} ${nVis.y + nVis.h} V308 H544 V135 H${nEval.x - 8}`, {
        color: green,
        width: 1.9,
    })
    f.arrow(nEval.x - 16, 135, nEval.x - 2, 135, { color: green, width: 1.9, head: 6 })
    f.rect(divX - 32, 122, 64, 26, {
        fill: tint(green, c.bg, 0.22),
        stroke: green,
        strokeWidth: 1.35,
        radius: 13,
    })
    f.text(divX, 135, 'Submit', {
        size: 12.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Hidden harness -> Final grade
    f.arrow(nEval.x + nEval.w / 2, nEval.y + nEval.h, nGrade.x + nGrade.w / 2, nGrade.y - 2, {
        color: green,
        width: 1.85,
        head: 6,
    })

    // Draw nodes
    drawNode(nIssue.x, nIssue.y, nIssue.w, nIssue.h, 'Issue + repo', 'pre-fix commit', blue)
    drawNode(nSearch.x, nSearch.y, nSearch.w, nSearch.h, 'Search + repro', 'gather evidence', blue)
    drawNode(nPatch.x, nPatch.y, nPatch.w, nPatch.h, 'Localize + patch', 'narrow code edit', purple)
    drawNode(nVis.x, nVis.y, nVis.w, nVis.h, 'Visible tests', 'local feedback', warm)
    drawNode(nEval.x, nEval.y, nEval.w, nEval.h, 'Run test patch', 'F2P + P2P checks', green)
    drawNode(nGrade.x, nGrade.y, nGrade.w, nGrade.h, 'Final grade', '0 or 1 resolved', green)

    return f.render()
}

export default create('dark')
