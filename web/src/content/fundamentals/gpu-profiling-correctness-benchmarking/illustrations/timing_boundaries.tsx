import React from 'react'
import { AxisPlot, Card, Row, Scene, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
const CONTENT_WIDTH = 800
export const alt =
    'A constructed CPU/GPU trace shares a 0–85 μs axis. The host launch call runs from 0 to 3 μs. CUDA events run from 5 to 75 μs, measuring 70 μs that include a 5 μs GPU gap and a kernel from 10 to 75 μs. Host synchronization returns at 78 μs.'

const MIN_TIME = -1.1
const MAX_TIME = 86.1
const CPU_Y = 1.625
const GPU_Y = 0.625
const AXIS_TRACKS = '1.1fr 3fr 2fr 5fr 10fr 20fr 20fr 15fr 3fr 2fr 5fr 1.1fr'

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const plotWidth = 660
    const plotHeight = 220
    const gridPaths = Array.from({ length: 9 }, (_, index) => index * 10).map((time) => ({
        points: [
            { x: time, y: 0.08 },
            { x: time, y: 1.92 },
        ],
        color: c.borderSubtle,
        strokeWidth: 1.1,
        opacity: 0.88,
    }))
    const boundaryPaths = [
        {
            points: [
                { x: 85, y: 0.08 },
                { x: 85, y: 1.92 },
            ],
            color: c.borderLight,
            strokeWidth: 1.4,
            opacity: 0.85,
        },
        {
            points: [
                { x: 0, y: 0.08 },
                { x: 85, y: 0.08 },
            ],
            color: c.borderLight,
            strokeWidth: 1.5,
            opacity: 0.82,
        },
        {
            points: [
                { x: 0, y: CPU_Y },
                { x: 85, y: CPU_Y },
            ],
            color: c.borderLight,
            strokeWidth: 1.5,
            opacity: 0.82,
        },
        {
            points: [
                { x: 0, y: GPU_Y },
                { x: 85, y: GPU_Y },
            ],
            color: c.borderLight,
            strokeWidth: 1.5,
            opacity: 0.82,
        },
    ]
    const markers = [
        { time: 5, y1: 0.28, y2: 0.98, color: c.primary },
        { time: 10, y1: 0.28, y2: 0.98, color: c.info },
        { time: 75, y1: 0.28, y2: 0.98, color: c.primary },
        { time: 78, y1: 1.28, y2: 1.94, color: c.positive },
    ].map(({ time, y1, y2, color }) => ({
        points: [
            { x: time, y: y1 },
            { x: time, y: y2 },
        ],
        color,
        strokeWidth: 2,
        dashed: true,
        opacity: 0.9,
    }))
    const activity = [
        {
            points: [
                { x: 0, y: CPU_Y },
                { x: 3, y: CPU_Y },
            ],
            color: c.warning,
            strokeWidth: 13,
        },
        {
            points: [
                { x: 3, y: CPU_Y },
                { x: 78, y: CPU_Y },
            ],
            color: c.primary,
            strokeWidth: 11,
            opacity: 0.72,
        },
        {
            points: [
                { x: 5, y: GPU_Y },
                { x: 10, y: GPU_Y },
            ],
            color: c.neutralLight,
            strokeWidth: 10,
            dashed: true,
        },
        {
            points: [
                { x: 10, y: GPU_Y },
                { x: 75, y: GPU_Y },
            ],
            color: c.info,
            strokeWidth: 15,
        },
    ]
    const bracket = (start: number, end: number, y: number, color: string, capTo: number) => [
        {
            points: [
                { x: start, y },
                { x: end, y },
            ],
            color,
            strokeWidth: 2.2,
            opacity: 0.95,
        },
        {
            points: [
                { x: start, y },
                { x: start, y: capTo },
            ],
            color,
            strokeWidth: 2.2,
            opacity: 0.95,
        },
        {
            points: [
                { x: end, y },
                { x: end, y: capTo },
            ],
            color,
            strokeWidth: 2.2,
            opacity: 0.95,
        },
    ]
    const durationBrackets = [
        ...bracket(0, 3, 1.92, c.warning, 1.82),
        ...bracket(5, 75, 1.08, c.primary, 0.98),
        ...bracket(0, 78, 0.16, c.positive, 0.27),
    ]
    const plot = AxisPlot({
        c,
        width: plotWidth,
        height: plotHeight,
        xMin: MIN_TIME,
        xMax: MAX_TIME,
        yMin: 0,
        yMax: 2,
        padding: 0,
        showAxes: false,
        showFrame: false,
        showGrid: false,
        paths: [...gridPaths, ...boundaryPaths, ...durationBrackets, ...markers, ...activity],
        points: [
            { x: 5, y: GPU_Y, r: 6, fill: c.primary },
            { x: 10, y: GPU_Y, r: 6, fill: c.info },
            { x: 75, y: GPU_Y, r: 6, fill: c.primary },
            { x: 78, y: CPU_Y, r: 6, fill: c.positive },
        ],
    })
    const eventLabels = (
        <div
            style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 660, marginLeft: 70 }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: AXIS_TRACKS,
                    width: '100%',
                    minHeight: 32,
                }}
            >
                <div
                    style={{
                        gridColumn: '4',
                        justifySelf: 'start',
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        whiteSpace: 'nowrap',
                    }}
                >
                    start · 5
                </div>
                <div
                    style={{
                        gridColumn: '9',
                        justifySelf: 'start',
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        whiteSpace: 'nowrap',
                    }}
                >
                    stop · 75
                </div>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: AXIS_TRACKS,
                    width: '100%',
                    minHeight: 32,
                }}
            >
                <div
                    style={{
                        gridColumn: '5',
                        justifySelf: 'start',
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        whiteSpace: 'nowrap',
                    }}
                >
                    kernel · 10
                </div>
                <div
                    style={{
                        gridColumn: '9',
                        justifySelf: 'end',
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        whiteSpace: 'nowrap',
                    }}
                >
                    return · 78
                </div>
            </div>
        </div>
    )
    const axisLabels = (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: AXIS_TRACKS,
                width: 660,
                marginLeft: 70,
                minHeight: 34,
                color: c.textSecondary,
                fontFamily: c.fontMono,
                fontSize: 30,
                fontWeight: 650,
                lineHeight: 1.15,
            }}
        >
            <div style={{ gridColumn: '2', gridRow: '1', justifySelf: 'start' }}>0</div>
            <div style={{ gridColumn: '6', gridRow: '1', justifySelf: 'start' }}>20</div>
            <div style={{ gridColumn: '7', gridRow: '1', justifySelf: 'start' }}>40</div>
            <div style={{ gridColumn: '8', gridRow: '1', justifySelf: 'start' }}>60</div>
            <div style={{ gridColumn: '11', justifySelf: 'end' }}>85</div>
        </div>
    )
    const legend = (
        <Row gap={16} justify="start" align="center" width={CONTENT_WIDTH}>
            <Row gap={8} justify="start" align="center">
                <div
                    style={{ width: 20, height: 7, borderRadius: 8, backgroundColor: c.warning }}
                />
                <div
                    style={{
                        color: c.textPrimary,
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 600,
                    }}
                >
                    host call
                </div>
            </Row>
            <Row gap={8} justify="start" align="center">
                <div
                    style={{ width: 20, height: 7, borderRadius: 8, backgroundColor: c.primary }}
                />
                <div
                    style={{
                        color: c.textPrimary,
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 600,
                    }}
                >
                    host wait
                </div>
            </Row>
            <Row gap={8} justify="start" align="center">
                <div
                    style={{
                        width: 20,
                        height: 7,
                        borderRadius: 8,
                        backgroundColor: c.neutralLight,
                    }}
                />
                <div
                    style={{
                        color: c.textPrimary,
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 600,
                    }}
                >
                    GPU gap
                </div>
            </Row>
            <Row gap={8} justify="start" align="center">
                <div style={{ width: 20, height: 7, borderRadius: 8, backgroundColor: c.info }} />
                <div
                    style={{
                        color: c.textPrimary,
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 600,
                    }}
                >
                    kernel
                </div>
            </Row>
        </Row>
    )
    const laneLabels = (
        <div
            style={{
                display: 'grid',
                gridTemplateRows: '82.5px 137.5px',
                width: 70,
                height: plotHeight,
                color: c.textPrimary,
                fontFamily: c.fontMono,
                fontSize: 30,
                fontWeight: 750,
                lineHeight: 1.2,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>CPU</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>GPU</div>
        </div>
    )

    return Scene({
        c,
        padding: 25,
        gap: 8,
        contentWidth: CONTENT_WIDTH,
        align: 'stretch',
        children: (
            <>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        width: CONTENT_WIDTH,
                    }}
                >
                    <div
                        style={{
                            color: c.textPrimary,
                            fontFamily: c.fontSans,
                            fontSize: 34,
                            fontWeight: 750,
                            lineHeight: 1.12,
                        }}
                    >
                        One request, two timing boundaries
                    </div>
                    <div
                        style={{
                            color: c.textSecondary,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 550,
                            lineHeight: 1.25,
                        }}
                    >
                        Constructed 0–85 μs trace · one shared time axis
                    </div>
                </div>
                {legend}
                {eventLabels}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '70px 660px 70px',
                        alignItems: 'stretch',
                        width: CONTENT_WIDTH,
                    }}
                >
                    {laneLabels}
                    {plot}
                    <div style={{ height: plotHeight }} />
                </div>
                {axisLabels}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: CONTENT_WIDTH,
                        color: c.textSecondary,
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 700,
                        lineHeight: 1.2,
                    }}
                >
                    Shared time axis (μs)
                </div>
                <Row gap={7} justify="center" align="stretch" width={CONTENT_WIDTH}>
                    <Card c={c} width={238} height={140} padding={9} borderColor={c.warning}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                width: '100%',
                            }}
                        >
                            <div
                                style={{
                                    color: c.textPrimary,
                                    fontFamily: c.fontSans,
                                    fontSize: 34,
                                    fontWeight: 750,
                                    lineHeight: 1.1,
                                }}
                            >
                                3 μs
                            </div>
                            <div
                                style={{
                                    color: c.textSecondary,
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 550,
                                    lineHeight: 1.2,
                                }}
                            >
                                host call · 0→3
                            </div>
                        </div>
                    </Card>
                    <Card c={c} width={238} height={140} padding={9} borderColor={c.primary}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
                                width: '100%',
                            }}
                        >
                            <div
                                style={{
                                    color: c.textPrimary,
                                    fontFamily: c.fontSans,
                                    fontSize: 34,
                                    fontWeight: 750,
                                    lineHeight: 1.1,
                                }}
                            >
                                70 μs
                            </div>
                            <div
                                style={{
                                    color: c.textSecondary,
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 550,
                                    lineHeight: 1.15,
                                }}
                            >
                                GPU gap 5
                            </div>
                            <div
                                style={{
                                    color: c.textSecondary,
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 550,
                                    lineHeight: 1.15,
                                }}
                            >
                                kernel 65
                            </div>
                        </div>
                    </Card>
                    <Card c={c} width={238} height={140} padding={9} borderColor={c.positive}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                width: '100%',
                            }}
                        >
                            <div
                                style={{
                                    color: c.textPrimary,
                                    fontFamily: c.fontSans,
                                    fontSize: 34,
                                    fontWeight: 750,
                                    lineHeight: 1.1,
                                }}
                            >
                                78 μs
                            </div>
                            <div
                                style={{
                                    color: c.textSecondary,
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 550,
                                    lineHeight: 1.2,
                                }}
                            >
                                wall · 0→78
                            </div>
                        </div>
                    </Card>
                </Row>
            </>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
