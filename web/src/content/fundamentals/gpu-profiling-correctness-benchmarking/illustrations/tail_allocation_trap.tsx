import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Card,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
const CONTENT_WIDTH = 800
export const alt =
    'For n = 257, blocks of 256 launch 512 threads. The logical output ends at index 256. With an exact 257-slot allocation, the inclusive guard i <= n attempts the out-of-bounds index 257. With 512 allocated slots, index 257 is inside storage but outside the result: the extra write changes NaN to 257.0 while the first 257 outputs match; index 258 remains NaN.'

interface TailCellProps {
    c: ReturnType<typeof getThemeColors>
    index: string
    value: string
    status: 'valid' | 'out' | 'poison' | 'write'
}

function TailCell({ c, index, value, status }: TailCellProps) {
    const tone =
        status === 'valid'
            ? c.positive
            : status === 'write'
              ? c.warning
              : status === 'out'
                ? c.critical
                : c.neutralLight
    return (
        <div
            role="cell"
            aria-label={`${index}: ${value}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                width: '100%',
                minHeight: 82,
                boxSizing: 'border-box',
                padding: '7px 4px',
                border: `2px solid ${tone}`,
                borderLeft: index === '257' ? `4px solid ${tone}` : `2px solid ${tone}`,
                borderRadius: 6,
                backgroundColor: status === 'poison' ? c.bgCardAlt : c.bgCard,
                color: c.textPrimary,
            }}
        >
            <div
                style={{
                    fontFamily: c.fontSans,
                    fontSize: 30,
                    fontWeight: 600,
                    lineHeight: 1.15,
                    textAlign: 'center',
                }}
            >
                {value}
            </div>
        </div>
    )
}

function indexRow(
    c: ReturnType<typeof getThemeColors>,
    label: string,
    cells: Array<{ index: string; value: string; status: TailCellProps['status'] }>,
) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '180px repeat(4, 1fr)',
                gap: 6,
                alignItems: 'stretch',
                width: CONTENT_WIDTH,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: c.textPrimary,
                    fontFamily: c.fontSans,
                    fontSize: 30,
                    fontWeight: 700,
                    lineHeight: 1.15,
                }}
            >
                {label}
            </div>
            {cells.map((cell) => (
                <TailCell key={`${label}-${cell.index}`} c={c} {...cell} />
            ))}
        </div>
    )
}

function detailCard(
    c: ReturnType<typeof getThemeColors>,
    widthPx: number,
    heading: string,
    detail: string,
    tone: string,
) {
    return (
        <Card c={c} width={widthPx} height={150} padding={10} borderColor={tone}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                <div
                    style={{
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 30,
                        fontWeight: 750,
                        lineHeight: 1.1,
                    }}
                >
                    {heading}
                </div>
                <div
                    style={{
                        color: c.textSecondary,
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 550,
                        lineHeight: 1.22,
                    }}
                >
                    {detail}
                </div>
            </div>
        </Card>
    )
}

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cell = (index: string, value: string, status: TailCellProps['status']) => ({
        index,
        value,
        status,
    })

    return Scene({
        c,
        padding: 25,
        gap: 6,
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
                            fontSize: 30,
                            fontWeight: 750,
                            lineHeight: 1.12,
                        }}
                    >
                        The tail of a rounded-up launch
                    </div>
                    <div
                        style={{
                            color: c.textSecondary,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 550,
                            lineHeight: 1.24,
                        }}
                    >
                        n = 257 · block = 256 · 512 threads launch
                    </div>
                </div>
                <Board c={c} width={CONTENT_WIDTH} height={158} background="transparent">
                    <CanvasItem x={0} y={0} width={CONTENT_WIDTH} height={158}>
                        {AxisPlot({
                            c,
                            width: CONTENT_WIDTH,
                            height: 158,
                            xMin: 0,
                            xMax: CONTENT_WIDTH,
                            yMin: 0,
                            yMax: 158,
                            padding: 0,
                            showFrame: false,
                            showAxes: false,
                            showGrid: false,
                            children: [
                                SvgFrame({
                                    c,
                                    x: 4,
                                    y: 12,
                                    width: 374,
                                    height: 108,
                                    rx: 10,
                                    fill: c.bgCard,
                                    stroke: c.info,
                                    strokeWidth: 2.5,
                                }),
                                SvgFrame({
                                    c,
                                    x: 394,
                                    y: 12,
                                    width: 402,
                                    height: 108,
                                    rx: 10,
                                    fill: c.bgCard,
                                    stroke: c.warning,
                                    strokeWidth: 2.5,
                                }),
                                SvgFrame({
                                    c,
                                    x: 406,
                                    y: 74,
                                    width: 84,
                                    height: 34,
                                    rx: 6,
                                    fill: c.bgCardAlt,
                                    stroke: c.positive,
                                    strokeWidth: 2,
                                }),
                                SvgFrame({
                                    c,
                                    x: 498,
                                    y: 74,
                                    width: 128,
                                    height: 34,
                                    rx: 6,
                                    fill: c.bgCardAlt,
                                    stroke: c.critical,
                                    strokeWidth: 2.5,
                                }),
                                SvgFrame({
                                    c,
                                    x: 634,
                                    y: 74,
                                    width: 150,
                                    height: 34,
                                    rx: 6,
                                    fill: c.bgCardAlt,
                                    stroke: c.neutralLight,
                                    strokeWidth: 1.5,
                                }),
                                VectorArrow({
                                    x1: 562,
                                    y1: 108,
                                    x2: 562,
                                    y2: 154,
                                    color: c.critical,
                                    strokeWidth: 4,
                                    arrowSize: 4,
                                }),
                            ],
                        })}
                    </CanvasItem>
                    <CanvasItem x={18} y={24} width={346} height={36}>
                        <TextLabel
                            c={c}
                            text="BLOCK 0: 0–255"
                            width="100%"
                            fontSize={28}
                            fontWeight={750}
                            color={c.info}
                            align="left"
                        />
                    </CanvasItem>
                    <CanvasItem x={18} y={70} width={346} height={36}>
                        <TextLabel
                            c={c}
                            text="Valid lanes: 0–255"
                            width="100%"
                            fontSize={28}
                            fontWeight={600}
                            color={c.textSecondary}
                            align="left"
                        />
                    </CanvasItem>
                    <CanvasItem x={406} y={24} width={380} height={36}>
                        <TextLabel
                            c={c}
                            text="BLOCK 1: 256–511"
                            width="100%"
                            fontSize={28}
                            fontWeight={750}
                            color={c.warning}
                            align="left"
                        />
                    </CanvasItem>
                    <CanvasItem x={408} y={77} width={80} height={30}>
                        <TextLabel
                            c={c}
                            text="256"
                            width="100%"
                            fontSize={26}
                            fontWeight={700}
                            color={c.positive}
                            align="center"
                        />
                    </CanvasItem>
                    <CanvasItem x={500} y={77} width={124} height={30}>
                        <TextLabel
                            c={c}
                            text="257 OOB"
                            width="100%"
                            fontSize={26}
                            fontWeight={750}
                            color={c.critical}
                            align="center"
                        />
                    </CanvasItem>
                    <CanvasItem x={636} y={77} width={146} height={30}>
                        <TextLabel
                            c={c}
                            text="258–511"
                            width="100%"
                            fontSize={26}
                            fontWeight={600}
                            color={c.textSecondary}
                            align="center"
                        />
                    </CanvasItem>
                </Board>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        width: CONTENT_WIDTH,
                    }}
                >
                    <div
                        style={{
                            color: c.textPrimary,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            lineHeight: 1.15,
                        }}
                    >
                        Zoom · logical output ends after index 256
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '180px repeat(4, 1fr)',
                            gap: 6,
                            width: CONTENT_WIDTH,
                        }}
                    >
                        <div />
                        {['255', '256', '257', '258'].map((index) => (
                            <div
                                key={`head-${index}`}
                                style={{
                                    color: c.textSecondary,
                                    textAlign: 'center',
                                    fontFamily: c.fontMono,
                                    fontSize: 30,
                                    fontWeight: 700,
                                }}
                            >
                                {index}
                            </div>
                        ))}
                    </div>
                    {indexRow(c, 'exact · 257', [
                        cell('255', 'valid', 'valid'),
                        cell('256', 'last valid', 'valid'),
                        cell('257', 'outside memory', 'out'),
                        cell('258', 'outside memory', 'out'),
                    ])}
                    {indexRow(c, '512 slots', [
                        cell('255', 'valid', 'valid'),
                        cell('256', 'last valid', 'valid'),
                        cell('257', 'NaN → 257.0', 'write'),
                        cell('258', 'NaN poison', 'poison'),
                    ])}
                    <div
                        style={{
                            color: c.textSecondary,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 550,
                            lineHeight: 1.2,
                        }}
                    >
                        Slot 257 exists in padded storage; the result ends at 256.
                    </div>
                </div>
                <Row gap={10} justify="center" align="stretch" width={CONTENT_WIDTH}>
                    {detailCard(c, 365, 'i < n', 'Writes 0–256; index 257 stays NaN.', c.positive)}
                    {detailCard(
                        c,
                        365,
                        'i ≤ n',
                        'Writes index 257; first 257 outputs match.',
                        c.warning,
                    )}
                </Row>
            </>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
