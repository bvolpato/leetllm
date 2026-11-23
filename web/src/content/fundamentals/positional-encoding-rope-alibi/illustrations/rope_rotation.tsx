import {
    AxisPlot,
    BadgePill,
    Column,
    Panel,
    Row,
    Scene,
    getThemeColors,
    withDensity,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

const DENSITY = 2.5

export const width = 848
export const height = 840
export const alt =
    'Two RoPE unit-circle panels compare positions (m=2, n=1) and (m=102, n=101) for q=k=[1,0] at theta=0.5. Shifting both positions by 100 rotates both vectors around the circle, while keeping relative angle -0.5 rad and dot product q′·k′=0.878 identical.'

const theta = 0.5

function arcPoints(r: number, start: number, end: number, steps = 48) {
    return Array.from({ length: steps + 1 }, (_, i) => {
        const a = start + ((end - start) * i) / steps
        return { x: r * Math.cos(a), y: r * Math.sin(a) }
    })
}

function makeCirclePanel(
    c: ThemeColors,
    qColor: string,
    kColor: string,
    gapColor: string,
    title: string,
    subtitle: string,
    m: number,
    n: number,
    tone: 'blue' | 'purple',
) {
    const aq = m * theta
    const ak = n * theta
    const qx = Math.cos(aq)
    const qy = Math.sin(aq)
    const kx = Math.cos(ak)
    const ky = Math.sin(ak)

    const wrap = (a: number) => {
        const twoPi = 2 * Math.PI
        return ((a % twoPi) + twoPi) % twoPi
    }
    const akW = wrap(ak)
    const aqW = akW + 0.5

    return Panel({
        c,
        title,
        subtitle,
        tone,
        titleFontSize: 29,
        padding: 12,
        gap: 8,
        width: 392,
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                AxisPlot({
                    c,
                    width: 245,
                    height: 245,
                    xMin: -1.25,
                    xMax: 1.25,
                    yMin: -1.25,
                    yMax: 1.25,
                    padding: 10,
                    showFrame: false,
                    showAxes: true,
                    showGrid: false,
                    xAxisLabel: 'x (even)',
                    yAxisLabel: 'y (odd)',
                    paths: [
                        {
                            points: arcPoints(1, 0, 2 * Math.PI, 72),
                            color: c.border,
                            strokeWidth: 2,
                        },
                        {
                            points: arcPoints(0.45, akW, aqW, 24),
                            color: gapColor,
                            strokeWidth: 4,
                        },
                    ],
                    vectors: [
                        {
                            x1: 0,
                            y1: 0,
                            x2: qx,
                            y2: qy,
                            color: qColor,
                            strokeWidth: 4.5,
                            arrow: true,
                            arrowSize: 8,
                        },
                        {
                            x1: 0,
                            y1: 0,
                            x2: kx,
                            y2: ky,
                            color: kColor,
                            strokeWidth: 4.5,
                            arrow: true,
                            arrowSize: 8,
                        },
                    ],
                    points: [
                        { x: qx, y: qy, fill: qColor, r: 5 },
                        { x: kx, y: ky, fill: kColor, r: 5 },
                    ],
                }),
                Column({
                    gap: 6,
                    align: 'center',
                    children: [
                        BadgePill({
                            c,
                            tone: 'blue',
                            text: `q′(${m}) = [${qx.toFixed(2)}, ${qy.toFixed(2)}]`,
                            fontSize: 25,
                            width: 340,
                        }),
                        BadgePill({
                            c,
                            tone: 'green',
                            text: `k′(${n}) = [${kx.toFixed(2)}, ${ky.toFixed(2)}]`,
                            fontSize: 25,
                            width: 340,
                        }),
                    ],
                }),
            ],
        }),
    })
}

function makeRopeRotation(theme: ThemeMode = 'dark') {
    const light = theme === 'light'
    const c = withDensity(getThemeColors(theme), DENSITY)
    const qColor = light ? c.primaryDark : c.primaryLight
    const kColor = light ? c.positiveDark : c.positiveLight
    const gapColor = light ? c.warningDark : c.warningLight

    return Scene({
        c,
        density: DENSITY,
        padding: 14,
        gap: 14,
        contentWidth: 800,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Row({
                    gap: 16,
                    align: 'stretch',
                    children: [
                        makeCirclePanel(
                            c,
                            qColor,
                            kColor,
                            gapColor,
                            'Base (m=2, n=1)',
                            'Angles 1.0 rad vs 0.5 rad',
                            2,
                            1,
                            'blue',
                        ),
                        makeCirclePanel(
                            c,
                            qColor,
                            kColor,
                            gapColor,
                            '+100 (m=102, n=101)',
                            'Angles 51.0 rad vs 50.5 rad',
                            102,
                            101,
                            'purple',
                        ),
                    ],
                }),
                Panel({
                    c,
                    title: 'Shift-invariant inner product',
                    titleFontSize: 25,
                    tone: 'neutral',
                    padding: 12,
                    gap: 8,
                    width: 800,
                    children: Row({
                        gap: 10,
                        justify: 'center',
                        children: [
                            BadgePill({
                                c,
                                tone: 'neutral',
                                text: 'Offset: n − m = −1',
                                fontSize: 25,
                            }),
                            BadgePill({ c, tone: 'warm', text: 'Arc gap: −0.5 rad', fontSize: 25 }),
                            BadgePill({
                                c,
                                tone: 'green',
                                text: 'Score q′·k′ = 0.878',
                                fontSize: 25,
                            }),
                        ],
                    }),
                }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeRopeRotation(theme)
}

export default create('dark')
