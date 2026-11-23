import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    AxisPlot,
    BadgePill,
    BarChart,
    ChartFrame,
    CodeBlock,
    Comparison,
    DataTable,
    Flow,
    GradientChip,
    GraphDiagram,
    Heatmap,
    KeyValueList,
    LayeredNetwork,
    LineChart,
    MetricCard,
    MiniBarChart,
    ProgressRow,
    QuadrantChart,
    ScatterPlot,
    StackedBar,
    StatusList,
    StatusRow,
    TextLabel,
    Tile,
    TileGrid,
    TiledMatrix,
    WindowFrame,
    createPlotArea,
    defineIllustration,
    formatMathText,
    getThemeColors,
    getToneColor,
    getToneGradient,
    withDensity,
} from 'vizmatic'

function renderFunctionComponent(element: React.ReactElement): React.ReactElement {
    if (typeof element.type !== 'function') return element
    return element.type(element.props) as React.ReactElement
}

describe('formatMathText', () => {
    it('renders simple subscripts and superscripts as unicode scripts', () => {
        expect(formatMathText('w_2 x x_2')).toBe('w₂ x x₂')
        expect(formatMathText('A^T A')).toBe('Aᵀ A')
    })

    it('renders braced and word scripts used in chart labels', () => {
        expect(formatMathText('theta_{t+1}')).toBe('thetaₜ₊₁')
        expect(formatMathText('N^alpha + D^beta')).toBe('Nᵅ + Dᵝ')
    })
})

describe('tone helpers', () => {
    it('shares semantic tone gradients and colors', () => {
        const c = getThemeColors('dark')

        // Tone helpers resolve to the shared palette, whose exact values belong to Vizmatic.
        expect(getToneGradient('purple')).toMatch(/#[0-9a-f]{6}/i)
        expect(getToneColor('green', c)).toBe(c.positiveLight)
        expect(getToneColor('critical', c)).toBe(c.criticalLight)
    })
})

describe('shared card and chip primitives', () => {
    it('omits undefined backgroundImage on unfilled badge pills', () => {
        const c = getThemeColors('dark')
        const element = BadgePill({ text: 'KV', c, tone: 'cyan' })

        expect(element.props.style.backgroundImage).toBeUndefined()
        expect(element.props.style.backgroundColor).toContain(c.infoLight.slice(0, 4))
    })

    it('emits concrete paint for filled badges and chips', () => {
        const c = getThemeColors('dark')
        const filledBadge = BadgePill({ text: 'Prefill', c, tone: 'purple', filled: true })
        const chip = GradientChip({
            title: 'tool schema',
            subtitle: 'stable JSON',
            c,
            tone: 'blue',
        })

        expect(filledBadge.props.style.backgroundImage).toContain('linear-gradient')
        expect(chip.props.style.backgroundColor).toBeTruthy()
    })

    it('wraps text in reusable primitives instead of overflowing fixed cards', () => {
        const c = getThemeColors('dark')
        const label = TextLabel({
            text: 'long support policy label that should wrap inside a narrow card',
            c,
            width: 96,
            align: 'center',
        })
        const table = DataTable({
            c,
            rows: [['long support policy label', 'value']],
            cellWidth: 72,
            firstColWidth: 72,
        })
        const chart = renderFunctionComponent(
            BarChart({
                c,
                data: [{ label: 'long policy label', value: 1 }],
                width: 220,
                height: 150,
            }),
        )
        const frame = renderFunctionComponent(
            ChartFrame({
                c,
                title: 'Long chart title that should not force overflow',
                legend: [{ label: 'very long legend label', color: 'primary' }],
                children: { type: 'div', props: {}, key: null },
            }),
        )

        const tableRows = (
            Array.isArray(table.props.children) ? table.props.children : [table.props.children]
        ).filter(Boolean) as React.ReactElement[]
        const firstTableCells = Array.isArray(tableRows[0].props.children)
            ? tableRows[0].props.children
            : [tableRows[0].props.children]
        const firstTableCell = firstTableCells[0]
        const chartChildren = (
            Array.isArray(chart.props.children) ? chart.props.children : [chart.props.children]
        ).filter(Boolean) as React.ReactElement[]
        const chartBody = chartChildren[0]
        const chartBodyChildren = (
            Array.isArray(chartBody.props.children)
                ? chartBody.props.children
                : [chartBody.props.children]
        ).filter(Boolean) as React.ReactElement[]
        const chartLabel = chartBodyChildren.find(
            (child: React.ReactElement) => child.key === 'bar-label-0',
        )
        const frameChildren = (
            Array.isArray(frame.props.children) ? frame.props.children : [frame.props.children]
        ).filter(Boolean) as React.ReactElement[]
        const frameHeader = frameChildren[0]
        const frameFooterChildren = (
            Array.isArray(frameChildren[2].props.children)
                ? frameChildren[2].props.children
                : [frameChildren[2].props.children]
        ).filter(Boolean) as React.ReactElement[]
        const legendItems = (
            Array.isArray(frameFooterChildren[0].props.children)
                ? frameFooterChildren[0].props.children
                : [frameFooterChildren[0].props.children]
        ).filter(Boolean) as React.ReactElement[]
        const legendItemChildren = (
            Array.isArray(legendItems[0].props.children)
                ? legendItems[0].props.children
                : [legendItems[0].props.children]
        ).filter(Boolean) as React.ReactElement[]
        const legendLabel = legendItemChildren[1]

        expect(label.props.style.whiteSpace).toBe('normal')
        expect(label.props.style.overflowWrap).toBe('break-word')
        expect(firstTableCell.props.style.whiteSpace).toBe('normal')
        expect(chartLabel.props.style.whiteSpace).toBe('normal')
        expect(frameHeader.props.style.minWidth).toBe(0)
        expect(legendLabel.props.style.overflowWrap).toBe('break-word')
    })
})

describe('standard illustration helpers', () => {
    it('places line-chart endpoints and markers on their true axis values', () => {
        const markup = renderToStaticMarkup(LineChart({
            c: withDensity(getThemeColors('light'), 1.8),
            series: [{ name: 'Accuracy', points: [-0.1, 0, 0.5, 1, 1.1] }],
            min: 0,
            max: 1,
        }))
        const ticks = [...markup.matchAll(/<line\b[^>]*\by1="([^"]+)"/g)].map(match => Number(match[1]))
        const top = Math.min(...ticks)
        const bottom = Math.max(...ticks)
        const markers = [...markup.matchAll(/<circle\b[^>]*\bcy="([^"]+)"/g)].map(match => Number(match[1]))
        expect(markers).toEqual([bottom, bottom, (bottom + top) / 2, top, top])
    })

    it('wraps theme creation boilerplate in defineIllustration', () => {
        const illustration = defineIllustration((c) => ({
            type: 'div',
            props: { style: { color: c.textPrimary } },
            key: null,
        }))

        expect(illustration.create('light').props.style.color).toBe(
            getThemeColors('light').textPrimary,
        )
        expect(illustration.default.props.style.color).toBe(getThemeColors('dark').textPrimary)
    })

    it('renders flow stages with connector fragments', () => {
        const c = getThemeColors('dark')
        const element = Flow({
            c,
            stages: [
                { title: 'Input', tone: 'blue' },
                { title: 'Output', tone: 'green' },
            ],
        })

        expect(element.props.style.flexDirection).toBe('row')
        expect(element.props.children).toHaveLength(3)
    })

    it('renders layered networks from data rather than article-local SVG code', () => {
        const c = getThemeColors('dark')
        const element = LayeredNetwork({
            c,
            layers: [
                { title: 'Input', tone: 'blue', nodes: ['x_1', 'x_2'] },
                { title: 'Output', tone: 'green', nodes: ['y_1'] },
            ],
            activePath: [1, 0],
            annotations: ['weights'],
            formula: 'y = f(Wx + b)',
        })
        const children = element.props.children as React.ReactElement[]
        const svg = children[0]
        const lines = svg.props.children as React.ReactElement[]

        expect(element.props.style.position).toBe('relative')
        expect(svg.props.viewBox).toBe('0 0 900 400')
        expect(lines).toHaveLength(2)
        expect(lines.some((line) => line.props.strokeWidth === 3.6)).toBe(true)
    })

    it('renders directed graph nodes and muted dashed paths from data', () => {
        const c = getThemeColors('dark')
        const element = GraphDiagram({
            c,
            nodes: [
                { id: 'route', label: 'Route', x: 0.5, y: 0.1, tone: 'purple' },
                { id: 'run', label: 'Run', x: 0.25, y: 0.7, tone: 'green' },
                { id: 'skip', label: 'Skip', x: 0.75, y: 0.7, muted: true },
            ],
            edges: [
                { from: 'route', to: 'run', tone: 'green' },
                { from: 'route', to: 'skip', muted: true, dashed: true, label: 'skip' },
            ],
        })
        const svg = element.props.children[0]
        const svgChildren = svg.props.children as React.ReactElement[]
        const paths = svgChildren.filter((child) => child.type === 'path')
        const nodes = (element.props.children as React.ReactElement[]).filter(
            (child) => typeof child?.key === 'string' && child.key.startsWith('graph-node-'),
        )

        expect(paths).toHaveLength(2)
        // Dashes follow the density scale, which is dense by default.
        expect(paths[1].props.strokeDasharray).toMatch(/^[\d.]+ [\d.]+$/)
        expect(nodes).toHaveLength(3)
    })

    it('renders highlighted matrix tiles and crossed-out materialization', () => {
        const c = getThemeColors('dark')
        const element = TiledMatrix({
            c,
            rows: 3,
            cols: 4,
            regions: [{ rowStart: 1, rowEnd: 3, colStart: 2, colEnd: 4, tone: 'green' }],
            crossedOut: true,
        })
        const elementChildren = Array.isArray(element.props.children)
            ? element.props.children
            : [element.props.children]
        const grid = elementChildren[0]
        const children = grid.props.children as React.ReactElement[]
        const rows = children.filter(
            (child) => typeof child.key === 'string' && child.key.startsWith('tiled-matrix-row-'),
        )
        const highlighted = rows.flatMap((row) =>
            (row.props.children as React.ReactElement[]).filter(
                (child) => child.props['data-region'] === 0,
            ),
        )

        expect(highlighted).toHaveLength(4)
        expect(grid.props['data-crossed-out']).toBe('true')
        expect(
            children.filter(
                (child) => child.key === 'cross-forward' || child.key === 'cross-backward',
            ),
        ).toHaveLength(2)
    })

    it('supports qualitative heatmaps with rectangular labeled cells', () => {
        const c = getThemeColors('dark')
        const element = Heatmap({
            c,
            data: [[0.2, 0.55, 0.9]],
            labels: [['low', 'mid', 'high']],
            xLabels: ['Prompt', 'RAG', 'Tune'],
            yLabels: ['Freshness'],
            cellWidth: 120,
            cellHeight: 40,
            rowLabelWidth: 100,
            colorScale: 'strength',
        })
        const matrix = element.props.children[1]
        const [columns, row] = matrix.props.children
        const cells = row.props.children.slice(1)

        expect(columns.props.style.marginLeft).toBe(104)
        expect(cells[0].props.style.width).toBe(120)
        expect(cells[0].props.style.height).toBe(40)
        expect(cells.map((cell: React.ReactElement) => cell.props.children)).toEqual([
            'low',
            'mid',
            'high',
        ])
        expect(cells[2].props.style.backgroundColor).toBe(c.positiveDark)
    })

    it('lets metric cards promote a hero value without local text helpers', () => {
        const c = getThemeColors('dark')
        const element = MetricCard({
            c,
            label: 'posterior',
            value: '16%',
            valueFontSize: 42,
            valueColor: c.positiveLight,
        })
        const body = Array.isArray(element.props.children)
            ? element.props.children[0]
            : element.props.children
        const value = body.props.children.props.children[1]

        expect(value.props.style.fontSize).toBe(42)
        expect(value.props.style.color).toBe(c.positiveLight)
    })

    it('renders progress rows with clamped percentages and muted tone support', () => {
        const c = getThemeColors('dark')
        const element = ProgressRow({
            c,
            label: 'E1',
            value: 1.4,
            valueLabel: '1.40',
            tone: 'green',
            muted: true,
        })
        const fill = element.props.children[1].props.children
        const value = element.props.children[2]

        expect(fill.props.style.width).toBe('100%')
        expect(fill.props.style.opacity).toBe(0.62)
        expect(value.props.children).toBe('1.40')
    })

    it('renders mini bar charts with compact labels and clamped baseline height', () => {
        const c = getThemeColors('dark')
        const element = MiniBarChart({
            c,
            data: [
                { label: '0', value: 0, tone: 'purple' },
                { label: '1', value: 0.5, tone: 'purple' },
            ],
            max: 1,
            minBarHeight: 6,
            height: 50,
            barWidth: 10,
        })
        const firstBar = element.props.children[0].props.children[0]
        const secondBar = element.props.children[1].props.children[0]

        expect(firstBar.props.style.height).toBe(6)
        expect(secondBar.props.style.height).toBe(15)
        expect(secondBar.props.style.backgroundColor).toBeTruthy()
    })

    it('renders proportional stacked bars and hides labels that do not fit', () => {
        const c = getThemeColors('dark')
        const element = StackedBar({
            c,
            width: 500,
            segments: [
                { label: 'fraud', value: 1, color: 'purple', valueLabel: '1%' },
                { label: 'legitimate', value: 99, color: 'cyan', valueLabel: '99%' },
            ],
        })
        const bar = element.props.children[1]
        const [smallSegment, largeSegment] = bar.props.children

        expect(smallSegment.props.style.width).toBe('1%')
        expect(smallSegment.props.children).toBe(false)
        expect(largeSegment.props.style.width).toBe('99%')
        expect(largeSegment.props.children.props.children).toBe('99%')
    })

    it('renders four shaded quadrant regions and clamps points into the plot', () => {
        const c = getThemeColors('dark')
        const element = renderFunctionComponent(
            QuadrantChart({
                c,
                width: 600,
                height: 320,
                regions: {
                    topLeft: { label: 'private', color: 'secondary' },
                    topRight: { label: 'high risk', color: 'warning' },
                    bottomLeft: { label: 'routine', color: 'positive' },
                    bottomRight: { label: 'hard', color: 'primary' },
                },
                points: [
                    { x: -0.2, y: 1.2, label: 'clamped', color: 'secondary' },
                    { x: 0.8, y: 0.2, label: 'inside', color: 'primary' },
                ],
            }),
        )
        const chart = element.props.children[1]
        const svg = chart.props.children[0]
        const svgChildren = svg.props.children as React.ReactElement[]
        const regions = svgChildren.filter(
            (child) => child.type === 'rect' && child.props.opacity === 0.1,
        )
        const points = svgChildren.filter((child) => child.type === 'circle')

        expect(regions).toHaveLength(4)
        expect(points).toHaveLength(2)
        expect(points[0].props.cx).toBe(24)
        expect(points[0].props.cy).toBe(18)
    })

    it('centralizes chart margins and clamps point labels inside plot bounds', () => {
        const c = getThemeColors('dark')
        const plot = createPlotArea(300, 200, { top: 20, right: 24, bottom: 34, left: 42 })

        expect(plot).toMatchObject({
            x: 42,
            y: 20,
            right: 276,
            bottom: 166,
            innerWidth: 234,
            innerHeight: 146,
        })

        const chart = renderFunctionComponent(
            ScatterPlot({
                c,
                width: 300,
                height: 200,
                xMin: 0,
                xMax: 1,
                yMin: 0,
                yMax: 1,
                points: [{ x: 0, y: 1, label: 'edge point' }],
            }),
        )
        const children = (chart.props.children as React.ReactNode[]).filter(
            Boolean,
        ) as React.ReactElement[]
        const plotLayer = children[0]
        const plotLayerChildren = (plotLayer.props.children as React.ReactNode[]).filter(
            Boolean,
        ) as React.ReactElement[]
        const label = plotLayerChildren.find((child) =>
            String(child.key).startsWith('scatter-point-label'),
        )

        expect(label?.props.style.transform).toBeUndefined()
        // The plot's left margin follows density, so check the label clears the axis labels.
        expect(label?.props.style.left).toBeGreaterThanOrEqual(40)
        expect(label?.props.style.top).toBeGreaterThanOrEqual(26)
    })

    it('renders linear and staircase function paths with axis labels', () => {
        const c = getThemeColors('dark')
        const element = AxisPlot({
            c,
            width: 400,
            height: 260,
            xMin: -1,
            xMax: 1,
            yMin: -1,
            yMax: 1,
            xAxisLabel: 'input',
            yAxisLabel: 'output',
            paths: [
                {
                    points: [
                        { x: -1, y: -1 },
                        { x: 1, y: 1 },
                    ],
                    tone: 'blue',
                    dashed: true,
                },
                {
                    points: [
                        { x: -1, y: -0.5 },
                        { x: 0, y: 0.5 },
                        { x: 1, y: 0.5 },
                    ],
                    tone: 'green',
                    interpolation: 'step-after',
                },
            ],
        })
        const [svg, ...labels] = element.props.children as React.ReactElement[]
        const children = svg.props.children as React.ReactElement[]
        const paths = children.filter((child) => child.type === 'path')

        expect(paths).toHaveLength(2)
        expect(paths[0].props.strokeDasharray).toBe('8 7')
        expect(paths[1].props.d).toContain('H ')
        expect(paths[1].props.d).toContain(' V ')
        expect(labels.map((label) => label.props.children)).toEqual(['input', 'output'])
    })

    it('borders tiles with their tone accent and renders detail lines', () => {
        const c = getThemeColors('dark')
        const element = Tile({
            c,
            title: 'Prompt caching',
            subtitle: 'reuse stable context',
            tone: 'green',
            lines: ['same prefix', 'cheap hits'],
        })

        expect(element.props.style.border).toContain(c.positiveLight)
    })

    it('lays tiles in a single wrapping row by default and a column of rows when columns is set', () => {
        const c = getThemeColors('dark')
        const tiles = [
            { title: 'A', tone: 'blue' as const },
            { title: 'B', tone: 'purple' as const },
            { title: 'C', tone: 'green' as const },
            { title: 'D', tone: 'warm' as const },
        ]

        const single = TileGrid({ c, tiles })
        expect(single.props.style.flexDirection).toBe('row')
        expect(single.props.style.flexWrap).toBe('wrap')

        const gridded = TileGrid({ c, tiles, columns: 2 })
        expect(gridded.props.style.flexDirection).toBe('column')
        expect(gridded.props.children).toHaveLength(2)
    })

    it('tints highlighted code lines with their tone and supports plain string lines', () => {
        const c = getThemeColors('dark')
        const element = CodeBlock({
            c,
            title: 'scratchpad.py',
            tone: 'purple',
            lines: ['plain line', { text: 'highlighted', tone: 'green' }],
        })
        const body = (element.props.children as React.ReactNode[])
            .filter(Boolean)
            .at(-1) as React.ReactElement
        const [plainLine, tonedLine] = body.props.children as React.ReactElement[]

        expect(plainLine.props.style.backgroundColor).toBeUndefined()
        expect(tonedLine.props.style.backgroundColor).toContain(c.positiveLight)
    })

    it('lays out comparison sides in a row and inserts a divider between them when requested', () => {
        const c = getThemeColors('dark')
        const withoutDivider = Comparison({
            c,
            sides: [
                { title: 'Naive', tone: 'red', lines: ['recompute everything'] },
                { title: 'Cached', tone: 'green', lines: ['reuse prefix'] },
            ],
        })
        expect(withoutDivider.props.style.flexDirection).toBe('row')
        expect(withoutDivider.props.children).toHaveLength(2)

        const withDivider = Comparison({
            c,
            divider: true,
            sides: [
                { title: 'Naive', tone: 'red' },
                { title: 'Cached', tone: 'green' },
            ],
        })
        expect(withDivider.props.children).toHaveLength(3)
    })

    it('renders key-value rows with tone-colored values and row dividers', () => {
        const c = getThemeColors('dark')
        const element = KeyValueList({
            c,
            rows: [
                { key: 'model', value: 'gpt-4o' },
                { key: 'temperature', value: '0.7', tone: 'green' },
            ],
        })
        const rows = (element.props.children as React.ReactNode[]).filter(
            Boolean,
        ) as React.ReactElement[]
        const [firstRow, secondRow] = rows
        const secondValue = secondRow.props.children[1]

        expect(firstRow.props.style.borderBottom).toContain(c.borderSubtle)
        expect(secondRow.props.style.borderBottom).toBeUndefined()
        expect(secondValue.props.style.color).toBe(c.positiveLight)
    })

    it('wraps content in a chrome frame with a title bar and a body', () => {
        const c = getThemeColors('dark')
        const element = WindowFrame({
            c,
            variant: 'browser',
            title: 'https://example.com',
            children: 'page content',
        })
        const [titleBar, body] = element.props.children as React.ReactElement[]

        expect(element.props.style.overflow).toBe('hidden')
        expect(titleBar.props.style.borderBottom).toContain(c.borderSubtle)
        expect(body.props.children).toBe('page content')
    })

    it.each(['dark', 'light'] as const)(
        'renders status glyphs and vertical lists in %s mode',
        (theme) => {
            const c = getThemeColors(theme)
            const pass = StatusRow({ c, label: 'schema valid', status: 'check' })
            const fail = StatusRow({ c, label: 'timeout', status: 'cross' })
            const passMarker = pass.props.children[0]
            const failMarker = fail.props.children[0]

            expect(passMarker.props.children).toBe('✓')
            expect(failMarker.props.children).toBe('✗')

            const list = StatusList({
                c,
                rows: [
                    { label: 'a', status: 'check' },
                    { label: 'b', status: 'cross' },
                ],
            })
            expect(list.props.style.flexDirection).toBe('column')
            expect(list.props.children).toHaveLength(2)
        },
    )
})
