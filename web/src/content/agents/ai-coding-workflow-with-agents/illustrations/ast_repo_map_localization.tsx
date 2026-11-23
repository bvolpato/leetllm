import {
    Column,
    GraphDiagram,
    Panel,
    ProgressList,
    Scene,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 640
export const height = 780
export const alt =
    'Top diagram shows an AST symbol dependency graph linking test_colon_header in test_http.py and dispatch_request in router.py to split_headers and parse_header_line in http_parse.py, plus backoff_delay in retry.py. Bottom panel displays combined PageRank and traceback relevance scores: parse_header_line leads at 0.54, followed by split_headers at 0.24, test_colon_header at 0.13, dispatch_request at 0.06, and backoff_delay at 0.03.'

export function create(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({
        c,
        title: 'AST symbol graph & context slice',
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: [
            Column({
                gap: 12,
                align: 'stretch',
                children: [
                    GraphDiagram({
                        c,
                        width: 616,
                        height: 356,
                        layout: 'manual',
                        routing: 'orthogonal',
                        routingClearance: 10,
                        nodeWidth: 238,
                        nodeHeight: 74,
                        labelFontSize: 20,
                        detailFontSize: 19,
                        arrowSize: 6,
                        ariaLabel: 'AST call graph across repository modules',
                        nodes: [
                            {
                                id: 'test',
                                label: 'test_colon_header',
                                detail: 'test_http.py:14',
                                x: 0.23,
                                y: 0.16,
                                tone: 'warm',
                            },
                            {
                                id: 'dispatch',
                                label: 'dispatch_request',
                                detail: 'router.py:41',
                                x: 0.77,
                                y: 0.16,
                                tone: 'blue',
                            },
                            {
                                id: 'split',
                                label: 'split_headers',
                                detail: 'http_parse.py:18',
                                x: 0.23,
                                y: 0.52,
                                tone: 'purple',
                            },
                            {
                                id: 'retry',
                                label: 'backoff_delay',
                                detail: 'retry.py:22 (cold)',
                                x: 0.77,
                                y: 0.52,
                                muted: true,
                            },
                            {
                                id: 'parse',
                                label: 'parse_header_line',
                                detail: 'http_parse.py:6 (fault)',
                                x: 0.23,
                                y: 0.86,
                                tone: 'green',
                            },
                        ],
                        edges: [
                            { from: 'test', to: 'split', tone: 'warm' },
                            { from: 'dispatch', to: 'split', tone: 'blue' },
                            { from: 'split', to: 'parse', tone: 'purple' },
                            { from: 'dispatch', to: 'retry', muted: true, style: 'dashed' },
                        ],
                    }),
                    Panel({
                        c,
                        title: 'Rank score (1,420 -> 28 lines)',
                        tone: 'green',
                        width: 616,
                        padding: 12,
                        titleFontSize: 21,
                        children: ProgressList({
                            c,
                            gap: 10,
                            labelWidth: 218,
                            valueWidth: 58,
                            barHeight: 16,
                            fontSize: 19,
                            rows: [
                                {
                                    label: 'parse_header_line',
                                    value: 0.54,
                                    valueLabel: '0.54',
                                    tone: 'green',
                                },
                                {
                                    label: 'split_headers',
                                    value: 0.24,
                                    valueLabel: '0.24',
                                    tone: 'purple',
                                },
                                {
                                    label: 'test_colon_header',
                                    value: 0.13,
                                    valueLabel: '0.13',
                                    tone: 'warm',
                                },
                                {
                                    label: 'dispatch_request',
                                    value: 0.06,
                                    valueLabel: '0.06',
                                    tone: 'blue',
                                },
                                {
                                    label: 'backoff_delay',
                                    value: 0.03,
                                    valueLabel: '0.03',
                                    muted: true,
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
