import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 390
export const alt =
    'Four memory-allocation behaviors diverge under pressure: ordinary cudaMalloc targets the device pool and fails with cudaErrorMemoryAllocation when full; explicit offload executes chosen layers on CPU or copies tensors across PCIe; CUDA managed memory migrates pages when platform capabilities support HMM or ATS; host pressure reads file-backed mmap pages from disk while swapping anonymous memory.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const red = fig.tone('red')

    fig.text(24, 22, 'Trace memory pressure to its physical allocation path', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(24, 44, 'Logs, fault counters, and transfer traces separate the four routes', {
        size: 13,
        color: c.textSecondary,
    })

    const boxH = 44
    const rowCenters = [104, 184, 264, 344]
    const labelX = 24
    const col1X = 166
    const col2X = 370
    const col3X = 576
    const colW = 160

    const drawNode = (
        x: number,
        cy: number,
        w: number,
        title: string,
        sub: string | undefined,
        tone: string,
        emphasize = false,
    ) => {
        fig.rect(x, cy - boxH / 2, w, boxH, {
            fill: tint(tone, c.bg, isLight ? (emphasize ? 0.18 : 0.1) : emphasize ? 0.3 : 0.18),
            stroke: tone,
            strokeWidth: emphasize ? 1.8 : 1.3,
            radius: 7,
        })
        if (sub) {
            fig.text(x + w / 2, cy - 7, title, {
                size: 13,
                weight: 700,
                color: emphasize ? tone : c.textPrimary,
                align: 'center',
            })
            fig.text(x + w / 2, cy + 10, sub, {
                size: 11.5,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        } else {
            fig.text(x + w / 2, cy, title, {
                size: 13.5,
                weight: 700,
                color: emphasize ? tone : c.textPrimary,
                align: 'center',
            })
        }
    }

    // Subtle row separators
    for (let i = 0; i < 3; i++) {
        const sepY = (rowCenters[i] + rowCenters[i + 1]) / 2
        fig.line(24, sepY, width - 24, sepY, { color: c.borderSubtle, width: 1 })
    }

    // Row 1: cudaMalloc -> VRAM pool -> CUDA OOM
    const y1 = rowCenters[0]
    fig.text(labelX, y1 - 8, '1. cudaMalloc', { size: 14, weight: 700, color: red })
    fig.text(labelX, y1 + 10, 'Device-only pool', { size: 12, color: c.textSecondary })
    drawNode(col1X, y1, colW, 'cudaMalloc()', 'device alloc', c.textMuted)
    drawNode(col2X, y1, colW, 'VRAM pool', 'fixed cap', blue)
    drawNode(col3X, y1, colW, 'CUDA OOM', 'hard error', red, true)
    fig.arrow(col1X + colW + 4, y1, col2X - 4, y1, { color: blue, width: 1.8 })
    fig.arrow(col2X + colW + 4, y1, col3X - 4, y1, { color: red, width: 1.8 })
    fig.text((col2X + colW + col3X) / 2, y1 - 12, 'full', {
        size: 11.5,
        weight: 600,
        color: red,
        align: 'center',
    })

    // Row 2: Explicit Offload
    const y2 = rowCenters[1]
    fig.text(labelX, y2 - 8, '2. Offload', { size: 14, weight: 700, color: warm })
    fig.text(labelX, y2 + 10, 'Runtime split', { size: 12, color: c.textSecondary })
    drawNode(col1X, y2, colW, 'CPU layers', 'host RAM', warm)
    drawNode(col2X, y2, colW, 'Explicit copy', 'PCIe transfer', warm)
    drawNode(col3X, y2, colW, 'GPU layers', 'VRAM resident', blue, true)
    fig.arrow(col1X + colW + 4, y2, col2X - 4, y2, { color: warm, width: 1.8 })
    fig.arrow(col2X + colW + 4, y2, col3X - 4, y2, { color: blue, width: 1.8 })

    // Row 3: CUDA Managed
    const y3 = rowCenters[2]
    fig.text(labelX, y3 - 8, '3. Managed', { size: 14, weight: 700, color: purple })
    fig.text(labelX, y3 + 10, 'Unified addr', { size: 12, color: c.textSecondary })
    drawNode(col1X, y3, colW, 'Page table', 'shared VA', purple)
    drawNode(col2X, y3, colW, 'Page fault', 'driver trap', purple)
    drawNode(col3X, y3, colW, 'HMM / ATS', 'migrate pages', purple, true)
    fig.arrow(col1X + colW + 4, y3, col2X - 4, y3, { color: purple, width: 1.8 })
    fig.arrow(col2X + colW + 4, y3, col3X - 4, y3, { color: purple, width: 1.8 })

    // Row 4: Host OS Paging
    const y4 = rowCenters[3]
    fig.text(labelX, y4 - 8, '4. Host OS', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(labelX, y4 + 10, 'RAM pressure', { size: 12, color: c.textSecondary })
    drawNode(col1X, y4, 270, 'File-backed mmap', 're-read from NVMe / disk', blue)
    drawNode(col1X + 298, y4, 272, 'Anonymous RAM', 'page out to swap I/O', warm)

    return fig.render()
}

export default create('dark')
