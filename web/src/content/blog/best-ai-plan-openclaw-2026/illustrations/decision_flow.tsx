import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 380
export const alt =
    'Credential routing decision tree. Workload check tests permitted scope first: disallowed work stops early; eligible work uses the primary key within task limits. On failure, a backup approval check verifies usage terms, data rules, and budget; approved tasks route to a named backup with logged spend, otherwise the task stops or waits.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const purple = f.tone('purple')
    const blue = f.tone('blue')
    const warm = f.tone('warm')
    const green = f.tone('green')
    const red = f.tone('critical')

    const drawNode = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        detail: string,
        tone: string,
        terminal = false,
    ) => {
        f.rect(x, y, w, h, {
            fill: tint(tone, c.bg, terminal ? 0.16 : 0.11),
            stroke: tone,
            strokeWidth: terminal ? 2 : 1.5,
            radius: 10,
        })
        if (terminal) {
            f.rect(x, y, 5, h, { fill: tone, radius: 2 })
        }
        f.text(x + w / 2 + (terminal ? 2 : 0), y + h * 0.36, title, {
            size: 15.5,
            weight: 700,
            color: tone,
            align: 'center',
            width: w - 16,
        })
        f.text(x + w / 2 + (terminal ? 2 : 0), y + h * 0.7, detail, {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
            width: w - 16,
        })
    }

    const drawPill = (cx: number, cy: number, label: string, tone: string, pw = 46) => {
        f.rect(cx - pw / 2, cy - 12, pw, 24, {
            fill: tint(tone, c.bg, 0.2),
            stroke: tone,
            strokeWidth: 1.25,
            radius: 12,
        })
        f.text(cx, cy, label, {
            size: 12.5,
            weight: 700,
            color: tone,
            align: 'center',
        })
    }

    // Node geometry (4 columns across 800px, compact 380px height)
    const n1 = { x: 16, y: 146, w: 164, h: 78 } // Workload check
    const n2 = { x: 226, y: 54, w: 164, h: 78 } // Primary key
    const nReject = { x: 226, y: 248, w: 164, h: 78 } // Stop early
    const n3 = { x: 432, y: 146, w: 166, h: 78 } // Backup approved?
    const nBackup = { x: 632, y: 54, w: 152, h: 78 } // Named backup
    const nHalt = { x: 632, y: 248, w: 152, h: 78 } // Stop or wait

    // Connectors behind pills
    const mid12 = (n1.x + n1.w + n2.x) / 2
    // Workload -> Primary (YES)
    f.path(
        `M${n1.x + n1.w} ${n1.y + 26} H${mid12} V${n2.y + n2.h / 2} H${n2.x - 8}`,
        { color: blue, width: 1.75 },
    )
    f.arrow(n2.x - 18, n2.y + n2.h / 2, n2.x - 2, n2.y + n2.h / 2, {
        color: blue,
        width: 1.75,
        head: 6,
    })
    drawPill(mid12, n2.y + n2.h / 2 - 24, 'YES', blue, 44)

    // Workload -> Stop early (NO)
    f.path(
        `M${n1.x + n1.w} ${n1.y + 52} H${mid12} V${nReject.y + nReject.h / 2} H${nReject.x - 8}`,
        { color: red, width: 1.75 },
    )
    f.arrow(nReject.x - 18, nReject.y + nReject.h / 2, nReject.x - 2, nReject.y + nReject.h / 2, {
        color: red,
        width: 1.75,
        head: 6,
    })
    drawPill(mid12, nReject.y + nReject.h / 2 + 24, 'NO', red, 40)

    // Primary -> Backup approved? (on failure)
    const mid23 = (n2.x + n2.w + n3.x) / 2
    f.path(
        `M${n2.x + n2.w} ${n2.y + n2.h / 2} H${mid23} V${n3.y + n3.h / 2} H${n3.x - 8}`,
        { color: warm, width: 1.75 },
    )
    f.arrow(n3.x - 18, n3.y + n3.h / 2, n3.x - 2, n3.y + n3.h / 2, {
        color: warm,
        width: 1.75,
        head: 6,
    })
    drawPill(mid23, n2.y + n2.h / 2 - 22, 'FAIL', warm, 48)

    // Backup approved? -> Named backup (YES)
    const mid34 = (n3.x + n3.w + nBackup.x) / 2
    f.path(
        `M${n3.x + n3.w} ${n3.y + 26} H${mid34} V${nBackup.y + nBackup.h / 2} H${nBackup.x - 8}`,
        { color: green, width: 1.75 },
    )
    f.arrow(nBackup.x - 16, nBackup.y + nBackup.h / 2, nBackup.x - 2, nBackup.y + nBackup.h / 2, {
        color: green,
        width: 1.75,
        head: 6,
    })
    drawPill(mid34, nBackup.y + nBackup.h / 2 - 24, 'YES', green, 44)

    // Backup approved? -> Stop or wait (NO)
    f.path(
        `M${n3.x + n3.w} ${n3.y + 52} H${mid34} V${nHalt.y + nHalt.h / 2} H${nHalt.x - 8}`,
        { color: red, width: 1.75 },
    )
    f.arrow(nHalt.x - 16, nHalt.y + nHalt.h / 2, nHalt.x - 2, nHalt.y + nHalt.h / 2, {
        color: red,
        width: 1.75,
        head: 6,
    })
    drawPill(mid34, nHalt.y + nHalt.h / 2 + 24, 'NO', red, 40)

    // Draw nodes
    drawNode(n1.x, n1.y, n1.w, n1.h, 'Workload check', 'permitted scope?', purple)
    drawNode(n2.x, n2.y, n2.w, n2.h, 'Primary key', 'within task limits', blue)
    drawNode(nReject.x, nReject.y, nReject.w, nReject.h, 'Stop early', 'disallowed scope', red, true)
    drawNode(n3.x, n3.y, n3.w, n3.h, 'Backup check', 'terms · data · budget', warm)
    drawNode(nBackup.x, nBackup.y, nBackup.w, nBackup.h, 'Named backup', 'log key + spend', green, true)
    drawNode(nHalt.x, nHalt.y, nHalt.w, nHalt.h, 'Stop or wait', 'no silent overflow', red, true)

    return f.render()
}

export default create('dark')
