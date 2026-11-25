import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 410
export const alt =
    'Side-by-side timelines compare block synchronization on shared tile[1,0]. With __syncthreads(), Warp 1 writes 65 from A[1,32], all 256 threads wait at the barrier, and Warp 0 reads 65 and stores it at B[32,1]. Without the barrier, one schedule lets Warp 0 read an unwritten stale value before Warp 1 writes 65, storing corrupted data at B[32,1].'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('red')

    // Center hairline separating synchronized vs racing schedules
    fig.line(width / 2, 16, width / 2, height - 16, { color: c.borderSubtle, width: 1 })

    const drawSide = (
        offsetX: number,
        title: string,
        subtitle: string,
        titleTone: string,
        synced: boolean,
    ) => {
        const cx = offsetX + 180
        const w1X = offsetX + 66
        const tileX = cx
        const w0X = offsetX + 294

        fig.text(cx, 24, title, { size: 15, weight: 700, color: titleTone, align: 'center' })
        fig.text(cx, 44, subtitle, { size: 12.5, color: c.textSecondary, align: 'center' })

        // Swimlane headers
        const headY = 74
        const topY = 92
        const botY = 342

        fig.text(w1X, headY, 'Warp 1', { size: 13, weight: 700, color: blue, align: 'center' })
        fig.text(tileX, headY, 'tile[1,0]', {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
        fig.text(w0X, headY, 'Warp 0', {
            size: 13,
            weight: 700,
            color: synced ? green : red,
            align: 'center',
        })

        // Vertical time rails
        fig.arrow(w1X, topY, w1X, botY, { color: c.border, width: 1.5, head: 5 })
        fig.line(tileX, topY, tileX, botY - 8, {
            color: c.borderSubtle,
            width: 2,
            dash: '4 4',
        })
        fig.arrow(w0X, topY, w0X, botY, { color: c.border, width: 1.5, head: 5 })

        // Time arrow label cleanly at bottom of left rail
        fig.text(w1X, botY + 14, 'time ↓', {
            size: 11.5,
            weight: 600,
            color: c.textMuted,
            align: 'center',
        })

        const drawOp = (
            x: number,
            y: number,
            w: number,
            label: string,
            sub: string,
            tone: string,
        ) => {
            fig.rect(x - w / 2, y - 20, w, 40, {
                fill: tint(tone, c.bg, isLight ? 0.16 : 0.28),
                stroke: tone,
                strokeWidth: 1.5,
                radius: 6,
            })
            fig.text(x, y - 6, label, {
                size: 12,
                weight: 700,
                color: tone,
                align: 'center',
            })
            fig.text(x, y + 10, sub, {
                size: 11.5,
                color: c.textPrimary,
                align: 'center',
                mono: true,
            })
        }

        if (synced) {
            // Step 1: Warp 1 writes 65 into tile[1,0]
            drawOp(w1X, 126, 98, 'Write', 'A[1,32]=65', blue)
            fig.arrow(w1X + 51, 126, tileX - 30, 126, { color: blue, width: 2, head: 6 })
            fig.rect(tileX - 26, 112, 52, 28, {
                fill: tint(blue, c.bg, isLight ? 0.22 : 0.36),
                stroke: blue,
                strokeWidth: 1.5,
                radius: 5,
            })
            fig.text(tileX, 126, '65', {
                size: 13.5,
                weight: 700,
                color: blue,
                align: 'center',
                mono: true,
            })

            // Barrier wall across all lanes
            const barY = 194
            fig.rect(offsetX + 20, barY - 16, 320, 32, {
                fill: tint(purple, c.bg, isLight ? 0.18 : 0.32),
                stroke: purple,
                strokeWidth: 1.8,
                radius: 6,
            })
            fig.text(cx, barY, '__syncthreads() · 256 threads wait', {
                size: 12.5,
                weight: 700,
                color: purple,
                align: 'center',
                mono: true,
            })

            // Step 2: Warp 0 reads 65 after barrier
            fig.rect(tileX - 26, 250, 52, 28, {
                fill: tint(green, c.bg, isLight ? 0.22 : 0.36),
                stroke: green,
                strokeWidth: 1.5,
                radius: 5,
            })
            fig.text(tileX, 264, '65', {
                size: 13.5,
                weight: 700,
                color: green,
                align: 'center',
                mono: true,
            })
            fig.arrow(tileX + 30, 264, w0X - 51, 264, { color: green, width: 2, head: 6 })
            drawOp(w0X, 264, 98, 'Load', 'tile[1,0]', green)

            // Store clean result
            drawOp(w0X, 318, 108, 'Store', 'B[32,1]=65', green)

            fig.text(cx, 378, 'Happens-before guarantees visible 65', {
                size: 12.5,
                weight: 700,
                color: green,
                align: 'center',
            })
        } else {
            // Uninitialized tile read BEFORE Warp 1 writes!
            fig.rect(tileX - 26, 112, 52, 28, {
                fill: tint(red, c.bg, isLight ? 0.18 : 0.3),
                stroke: red,
                strokeWidth: 1.5,
                radius: 5,
            })
            fig.text(tileX, 126, '???', {
                size: 13,
                weight: 700,
                color: red,
                align: 'center',
                mono: true,
            })
            fig.arrow(tileX + 30, 126, w0X - 51, 126, { color: red, width: 2.2, head: 6 })
            drawOp(w0X, 126, 98, 'Early read', 'stale ???', red)

            // Warp 1 writes 65 too late
            drawOp(w1X, 214, 98, 'Late write', 'A[1,32]=65', warm)
            fig.arrow(w1X + 51, 214, tileX - 30, 214, { color: warm, width: 2, head: 6 })
            fig.rect(tileX - 26, 200, 52, 28, {
                fill: tint(warm, c.bg, isLight ? 0.2 : 0.34),
                stroke: warm,
                strokeWidth: 1.5,
                radius: 5,
            })
            fig.text(tileX, 214, '65', {
                size: 13.5,
                weight: 700,
                color: warm,
                align: 'center',
                mono: true,
            })

            // Visual hazard annotation between read and write
            fig.text(cx, 168, 'RAW hazard (no barrier)', {
                size: 11.5,
                weight: 700,
                color: red,
                align: 'center',
            })

            // Warp 0 stores corrupted value
            drawOp(w0X, 304, 108, 'Corrupt store', 'B[32,1]=?', red)

            fig.text(cx, 378, 'compute-sanitizer racecheck fails (exit 2)', {
                size: 12.5,
                weight: 700,
                color: red,
                align: 'center',
            })
        }
    }

    drawSide(12, 'With __syncthreads()', 'Warp 1 writes before Warp 0 reads', green, true)
    drawSide(388, 'No Barrier: Data Race', 'Warp 0 can overtake Warp 1', red, false)

    return fig.render()
}

export default create('dark')
