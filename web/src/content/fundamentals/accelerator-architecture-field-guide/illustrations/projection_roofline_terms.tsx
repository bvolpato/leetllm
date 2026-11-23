import {
    AxisPlot,
    Column,
    FlowArrow,
    getReadableToneColor,
    getToneColor,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 620
export const height = 800
export const alt =
    'Two independent linear time axes compare compute and traffic ceilings for prefill and decode. Bars use full-precision model values; displayed times round to 0.001 ms. With hypothetical 200 TFLOP/s compute and 1 TB/s bandwidth, prefill has 14.775 ms compute versus 1.080 ms traffic and a 14.775 ms floor; at 400 TFLOP/s, compute falls to 7.387 ms and sets the floor. Decode has 0.004 ms compute versus 0.090 ms traffic; a compute-only 0–0.005 ms inset enlarges the first bar 20×. Doubling compute changes compute time to 0.002 ms but leaves the 0.090 ms floor. The perfect-overlap model predicts floors, not measured device times.'

const illustration = defineIllustration((c) => {
    const contentWidth = width - 32
    const chartGap = 16
    const chartWidth = (contentWidth - chartGap) / 2
    const labelWidth = 54
    const valueWidth = 80
    const trackStart = labelWidth + 8
    const trackWidth = chartWidth - labelWidth - valueWidth - 16
    const tickCellWidth = 68
    const tickRowWidth = trackWidth + tickCellWidth
    const tickLeadingSpace = trackStart - tickCellWidth / 2 - 8
    const tickTrailingSpace = chartWidth - tickLeadingSpace - tickRowWidth - 16

    const timeRow = (
        label: string,
        value: number,
        scale: number,
        valueLabel: string,
        tone: 'purple' | 'cyan',
    ) => {
        const ratio = Math.max(0, Math.min(1, value / scale))
        const fill = getToneColor(tone, c)

        return Row({
            width: chartWidth,
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: label,
                    fontSize: 22,
                    fontWeight: 700,
                    color: c.textPrimary,
                    width: labelWidth,
                }),
                AxisPlot({
                    c,
                    width: trackWidth,
                    height: 12,
                    xMin: 0,
                    xMax: scale,
                    yMin: 0,
                    yMax: 1,
                    padding: 0,
                    showFrame: false,
                    showAxes: false,
                    showGrid: false,
                    children: [
                        SvgFrame({
                            c,
                            x: 0,
                            y: 0,
                            width: trackWidth,
                            height: 12,
                            rx: 6,
                            fill: c.bgSubtle,
                            stroke: c.borderSubtle,
                            strokeWidth: 1,
                        }),
                        SvgFrame({
                            c,
                            x: 0,
                            y: 0,
                            width: trackWidth * ratio,
                            height: 12,
                            rx: 6,
                            fill,
                            stroke: fill,
                            strokeWidth: 0,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: valueLabel,
                    fontSize: 22,
                    mono: true,
                    color: getReadableToneColor(tone, c),
                    align: 'right',
                    width: valueWidth,
                }),
            ],
        })
    }

    const tickAxis = (max: number, tickValues: number[], labels: string[], caption: string) =>
        Column({
            width: chartWidth,
            gap: 2,
            children: [
                Row({
                    width: chartWidth,
                    gap: 8,
                    align: 'center',
                    children: [
                        TextLabel({ c, text: '', width: tickLeadingSpace }),
                        Row({
                            width: tickRowWidth,
                            gap: 0,
                            justify: 'space-between',
                            children: tickValues.map((value, index) =>
                                TextLabel({
                                    c,
                                    text: labels[index],
                                    fontSize: 22,
                                    color: c.textSecondary,
                                    mono: true,
                                    width: tickCellWidth,
                                    align: 'center',
                                }),
                            ),
                        }),
                        TextLabel({ c, text: '', width: tickTrailingSpace }),
                    ],
                }),
                TextLabel({
                    c,
                    text: caption,
                    fontSize: 22,
                    color: c.textMuted,
                    align: 'center',
                    width: chartWidth,
                }),
            ],
        })

    const phase = (
        title: string,
        axisMax: number,
        axisLabels: string[],
        axisCaption: string,
        tickValues: number[],
        rows: Array<{ peak: number; flops: number; trafficBytes: number }>,
        computeInset = false,
    ) =>
        Column({
            width: chartWidth,
            align: 'stretch',
            gap: 5,
            children: [
                TextLabel({ c, text: title, fontSize: 24, fontWeight: 750, color: c.textPrimary }),
                ...rows.map((row) => {
                    const computeMs = (1000 * row.flops) / (row.peak * 1e12)
                    const trafficMs = (1000 * row.trafficBytes) / 1e12
                    const floorMs = Math.max(computeMs, trafficMs)
                    const label = (value: number) => value.toFixed(3)

                    return Column({
                        width: chartWidth,
                        gap: 2,
                        children: [
                            TextLabel({
                                c,
                                text: `P = ${row.peak} TFLOP/s`,
                                fontSize: 22,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                            timeRow('F/P', computeMs, axisMax, label(computeMs), 'purple'),
                            timeRow('Q/B', trafficMs, axisMax, label(trafficMs), 'cyan'),
                            FlowArrow({ c, direction: 'down', tone: 'green', length: 10 }),
                            TextLabel({
                                c,
                                text: `max = ${label(floorMs)} ms`,
                                fontSize: 22,
                                fontWeight: 700,
                                mono: true,
                                color: getReadableToneColor('green', c, c.bg, c.bg),
                                align: 'center',
                                width: chartWidth,
                            }),
                        ],
                    })
                }),
                tickAxis(axisMax, tickValues, axisLabels, axisCaption),
                ...(computeInset
                    ? [
                          Column({
                              width: chartWidth,
                              gap: 3,
                              children: [
                                  TextLabel({
                                      c,
                                      text: 'F/P inset · 20×',
                                      fontSize: 22,
                                      fontWeight: 700,
                                      color: c.textPrimary,
                                  }),
                                  ...rows.map((row) => {
                                      const computeMs = (1000 * row.flops) / (row.peak * 1e12)
                                      return timeRow(
                                          `P${row.peak}`,
                                          computeMs,
                                          0.005,
                                          computeMs.toFixed(3),
                                          'purple',
                                      )
                                  }),
                                  tickAxis(
                                      0.005,
                                      [0, 0.0025, 0.005],
                                      ['0', '.0025', '.005'],
                                      'Linear ms · 0–0.005',
                                  ),
                              ],
                          }),
                      ]
                    : []),
            ],
        })

    return Scene({
        c,
        padding: 16,
        gap: 8,
        align: 'center',
        contentWidth,
        title: 'The larger time term sets the floor',
        children: Column({
            width: contentWidth,
            gap: 8,
            children: [
                TextLabel({
                    c,
                    text: 'Time floor = max(F/P, Q/B) · perfect overlap',
                    fontSize: 22,
                    mono: true,
                    align: 'center',
                    color: c.textSecondary,
                    width: contentWidth,
                }),
                TextLabel({
                    c,
                    text: 'Full-precision bars · labels round to 0.001 ms',
                    fontSize: 22,
                    align: 'center',
                    color: c.textSecondary,
                    width: contentWidth,
                }),
                Row({
                    width: contentWidth,
                    gap: chartGap,
                    align: 'start',
                    children: [
                        phase(
                            'Prefill · M = 32,768',
                            15,
                            ['0', '7.5', '15'],
                            'Linear ms · 0–15',
                            [0, 7.5, 15],
                            [
                                {
                                    peak: 200,
                                    flops: 2_954_937_499_648,
                                    trafficBytes: 1_080_033_280,
                                },
                                {
                                    peak: 400,
                                    flops: 2_954_937_499_648,
                                    trafficBytes: 1_080_033_280,
                                },
                            ],
                            false,
                        ),
                        phase(
                            'Decode · M = 8',
                            0.1,
                            ['0', '.05', '.10'],
                            'Linear ms · 0–.10',
                            [0, 0.05, 0.1],
                            [
                                { peak: 200, flops: 721_420_288, trafficBytes: 90_419_200 },
                                { peak: 400, flops: 721_420_288, trafficBytes: 90_419_200 },
                            ],
                            true,
                        ),
                    ],
                }),
                Column({
                    width: contentWidth,
                    gap: 2,
                    children: [
                        Row({
                            width: contentWidth,
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'P × 2',
                                    fontSize: 22,
                                    mono: true,
                                    color: c.textPrimary,
                                }),
                                FlowArrow({ c, direction: 'right', tone: 'purple', length: 20 }),
                                TextLabel({
                                    c,
                                    text: 'F/P × 0.5',
                                    fontSize: 22,
                                    mono: true,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Decode max stays 0.090 ms',
                            fontSize: 22,
                            mono: true,
                            color: c.textSecondary,
                            width: contentWidth,
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
