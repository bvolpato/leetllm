import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Panel,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    getToneColor,
    type ThemeMode,
} from 'vizmatic'

export const width = 640
export const height = 780
export const alt =
    'Top plot graphs unbiased pass@k for n = 20 rollouts across k = 1 to 16: base rate p = 0.50 reaches 0.96 by k = 4, p = 0.30 reaches 0.79, and p = 0.15 reaches 0.51. Bottom panel compares k = 4 solve rates: stale fixed localization caps at 0.56, full end-to-end resampling reaches 0.76, and improved AST mapping to p = 0.50 reaches 0.94.'

export function create(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const plotW = 616
    const plotH = 310
    const pad = 64
    const xPos = (k: number) => pad + ((k - 1) / 15) * (plotW - 2 * pad)
    const yPos = (rate: number) => pad + (1 - rate) * (plotH - 2 * pad)
    const label = (text: string, x: number, y: number, w: number, color = c.textMuted, size = 19) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: size * 1.4,
            children: TextLabel({
                c,
                text,
                fontSize: size,
                color,
                align: 'center',
                width: w,
            }),
        })

    const passAtK = (p: number, k: number) => {
        const n = 20
        const corr = Math.round(n * p)
        if (n - corr < k) return 1
        let fail = 1
        for (let i = 0; i < k; i++) fail *= (n - corr - i) / (n - i)
        return 1 - fail
    }
    const ks = [1, 2, 4, 8, 12, 16]
    const mkPath = (p: number, tone: 'green' | 'blue' | 'warm') => ({
        points: ks.map((k) => ({ x: k, y: passAtK(p, k) })),
        tone,
        strokeWidth: 4,
    })

    return Scene({
        c,
        title: 'Unbiased pass@k (n = 20 rollouts)',
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: [
            Column({
                gap: 10,
                align: 'center',
                children: [
                    Row({
                        gap: 24,
                        justify: 'center',
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: '● p = 0.50',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getToneColor('green', c),
                            }),
                            TextLabel({
                                c,
                                text: '● p = 0.30',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getToneColor('blue', c),
                            }),
                            TextLabel({
                                c,
                                text: '● p = 0.15',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getToneColor('warm', c),
                            }),
                        ],
                    }),
                    Board({
                        c,
                        width: plotW,
                        height: plotH,
                        children: [
                            CanvasItem({
                                x: 0,
                                y: 0,
                                width: plotW,
                                height: plotH,
                                children: AxisPlot({
                                    c,
                                    width: plotW,
                                    height: plotH,
                                    padding: pad,
                                    xMin: 1,
                                    xMax: 16,
                                    yMin: 0,
                                    yMax: 1,
                                    showGrid: true,
                                    gridCount: 4,
                                    paths: [
                                        mkPath(0.5, 'green'),
                                        mkPath(0.3, 'blue'),
                                        mkPath(0.15, 'warm'),
                                    ],
                                    points: ks.flatMap((k) => [
                                        { x: k, y: passAtK(0.5, k), tone: 'green', r: 5 },
                                        { x: k, y: passAtK(0.3, k), tone: 'blue', r: 5 },
                                        { x: k, y: passAtK(0.15, k), tone: 'warm', r: 5 },
                                    ]),
                                }),
                            }),
                            label('1', xPos(1) - 18, plotH - pad + 8, 36),
                            label('4', xPos(4) - 18, plotH - pad + 8, 36),
                            label('8', xPos(8) - 18, plotH - pad + 8, 36),
                            label('16', xPos(16) - 24, plotH - pad + 8, 48),
                            label('0%', 6, yPos(0) - 13, 52),
                            label('50%', 6, yPos(0.5) - 13, 52),
                            label('100%', 4, yPos(1) - 13, 58),
                        ],
                    }),
                    Panel({
                        c,
                        title: 'k = 4 solve rate vs localization ceiling',
                        tone: 'purple',
                        width: 616,
                        padding: 12,
                        titleFontSize: 21,
                        children: ProgressList({
                            c,
                            gap: 10,
                            labelWidth: 235,
                            valueWidth: 68,
                            barHeight: 16,
                            fontSize: 19,
                            rows: [
                                {
                                    label: 'Stale localization',
                                    value: 0.56,
                                    valueLabel: '56%',
                                    tone: 'warm',
                                },
                                {
                                    label: 'Full trajectory sample',
                                    value: 0.76,
                                    valueLabel: '76%',
                                    tone: 'blue',
                                },
                                {
                                    label: 'Better AST map (p=0.5)',
                                    value: 0.94,
                                    valueLabel: '94%',
                                    tone: 'green',
                                },
                            ],
                        }),
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
