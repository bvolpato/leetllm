import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableColor,
    getReadableTextColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'
export { createFilm } from './_parts/continuous-batching-film'

export const alt =
    'On one shared 0 to 1,800 position scale, the current 1,024-position iteration contains 96 decode positions and 928 prefill positions. The 1,800-token prompt sends 928 positions now and leaves 872 queued. Position counts describe work placed into the step.'

export const width = 900
export const height = 700

const chartX = 190
const chartY = 160
const chartWidth = 660
const chartHeight = 350
const chartPadding = 24
const positionMax = 1800
const iterationRow = 1.75
const promptRow = 0.75

function text(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 500,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(36, fontSize + 8),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

function xAt(value: number) {
    return chartPadding + (value / positionMax) * (chartWidth - 2 * chartPadding)
}

function yAt(value: number) {
    return chartPadding + ((2.5 - value) / 2.5) * (chartHeight - 2 * chartPadding)
}

function budgetPlot(c: ReturnType<typeof getThemeColors>) {
    const paths = [
        ...[0, 450, 900, 1350, 1800].map((x) => ({
            points: [
                { x, y: 0.25 },
                { x, y: 2.35 },
            ],
            color: c.borderSubtle,
            strokeWidth: 1,
        })),
        {
            points: [
                { x: 928, y: 0.3 },
                { x: 928, y: 1.2 },
            ],
            color: c.borderLight,
            strokeWidth: 2,
            dashed: true,
        },
        {
            points: [
                { x: 1024, y: 1.55 },
                { x: 1024, y: 1.95 },
            ],
            color: c.warning,
            strokeWidth: 2,
        },
    ]

    const segment = (start: number, end: number, row: number, height: number, fill: string) =>
        SvgFrame({
            c,
            x: xAt(start),
            y: yAt(row) - height / 2,
            width: xAt(end) - xAt(start),
            height,
            rx: 0,
            fill,
            stroke: 'none',
            strokeWidth: 0,
        })

    // Rectangles share the same count scale, so their edges mark exact checkpoints.
    const bars = [
        segment(0, 96, iterationRow, 40, c.secondary),
        segment(96, 1024, iterationRow, 40, c.primary),
        segment(0, positionMax, promptRow, 46, c.neutralLight),
        segment(0, 928, promptRow, 46, c.primary),
    ]

    return AxisPlot({
        c,
        width: chartWidth,
        height: chartHeight,
        padding: chartPadding,
        xMin: 0,
        xMax: positionMax,
        yMin: 0,
        yMax: 2.5,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        paths,
        children: bars,
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const textBackdrop = theme === 'dark' ? '#0a0b0e' : '#ffffff'
    const readable = (tone: 'secondary' | 'warning') => getReadableColor(tone, c)
    const textOn = (fill: string) => getReadableTextColor(fill, c, textBackdrop)
    const iterationY = chartY + yAt(iterationRow)
    const promptY = chartY + yAt(promptRow)
    const ticks = [0, 450, 900, 1350, 1800]
    const children = [
        text(c, 'A 1,024-position step budget', 20, 12, 860, 36, c.textPrimary, 'left', 700),
        text(c, '96 decode positions leave 928 for prompt work.', 20, 58, 860, 35, c.textSecondary),
        text(c, 'Step', 16, iterationY - 20, 160, 35, c.textPrimary, 'right', 650),
        text(c, 'Prompt', 16, promptY - 20, 160, 35, c.textPrimary, 'right', 650),
        CanvasItem({
            x: chartX,
            y: chartY,
            width: chartWidth,
            height: chartHeight,
            children: budgetPlot(c),
        }),

        text(
            c,
            '96 decode',
            chartX + xAt(48) - 110,
            iterationY - 68,
            220,
            35,
            readable('secondary'),
            'center',
            700,
        ),
        text(
            c,
            '928 prefill',
            chartX + xAt((96 + 1024) / 2) - 145,
            iterationY - 20,
            290,
            35,
            textOn(c.primary),
            'center',
            700,
        ),
        text(
            c,
            '1,024 cap',
            chartX + xAt(1024) - 110,
            iterationY - 68,
            220,
            35,
            readable('warning'),
            'center',
            700,
        ),
        text(
            c,
            '928 scheduled',
            chartX + xAt(464) - 145,
            promptY - 23,
            290,
            35,
            textOn(c.primary),
            'center',
            700,
        ),
        text(
            c,
            '872 queued',
            chartX + xAt((928 + 1800) / 2) - 125,
            promptY - 23,
            250,
            35,
            textOn(c.neutralLight),
            'center',
            700,
        ),

        ...ticks.map((value) =>
            text(
                c,
                value === 1800 ? '1,800' : String(value),
                chartX + xAt(value) - 50,
                chartY + chartHeight + 10,
                100,
                35,
                c.textSecondary,
                'center',
                600,
            ),
        ),
        text(
            c,
            '96 decode + 928 prefill = 1,024 positions.',
            20,
            580,
            860,
            35,
            c.textPrimary,
            'left',
            650,
        ),
        text(
            c,
            'The remaining 872 prompt tokens stay queued.',
            20,
            628,
            860,
            35,
            c.textSecondary,
            'left',
            500,
        ),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

export default create('dark')
