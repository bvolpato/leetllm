import {
    QuadrantChart,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 580
export const height = 500
export const alt =
    'Quadrant chart mapping context support against world accuracy. C1 (Supported) serves directly, C4 (Uncited) needs a retrieved citation, C2 (Fabricated) and C3 (Contradicted) are pruned or blocked, and Stale doc triggers index refresh.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const chart = preparePrintTypography(
        QuadrantChart({
            c,
            width: 540,
            height: 350,
            xMin: 0,
            xMax: 1,
            yMin: 0,
            yMax: 1,
            xThreshold: 0.5,
            yThreshold: 0.5,
            xAxisLabel: 'Support in retrieved docs',
            yAxisLabel: 'World accuracy',
            showTicks: false,
            showGrid: false,
            regions: {
                topRight: {
                    label: 'Serve',
                    color: getReadableToneColor('green', c),
                    emphasis: true,
                },
                topLeft: {
                    label: 'Retrieve source',
                    color: getReadableToneColor('warm', c),
                },
                bottomLeft: {
                    label: 'Prune or block',
                    color: getReadableToneColor('critical', c),
                },
                bottomRight: {
                    label: 'Refresh docs',
                    color: getReadableToneColor('purple', c),
                },
            },
            points: [
                {
                    x: 0.75,
                    y: 0.8,
                    label: 'C1',
                    color: getReadableToneColor('green', c),
                    size: 4.5,
                },
                {
                    x: 0.25,
                    y: 0.74,
                    label: 'C4',
                    color: getReadableToneColor('warm', c),
                    size: 4.5,
                },
                {
                    x: 0.75,
                    y: 0.24,
                    label: 'Stale',
                    color: getReadableToneColor('purple', c),
                    size: 4.5,
                },
                {
                    x: 0.2,
                    y: 0.32,
                    label: 'C2',
                    color: getReadableToneColor('critical', c),
                    size: 4.5,
                },
                {
                    x: 0.36,
                    y: 0.14,
                    label: 'C3',
                    color: getReadableToneColor('critical', c),
                    size: 4.5,
                },
            ],
        }),
        18,
    )

    return Scene({
        c,
        padding: 18,
        gap: 8,
        contentWidth: 544,
        children: [
            TextLabel({
                c,
                text: 'Factuality and context grounding are distinct',
                fontSize: 22,
                fontWeight: 750,
            }),
            TextLabel({
                c,
                text: 'True facts without citations still require retrieved support.',
                fontSize: 18,
                color: c.textSecondary,
            }),
            chart,
            TextLabel({
                c,
                text: 'C1 Supported · C2 Fabricated · C3 Contradicted · C4 Uncited',
                fontSize: 18,
                color: c.textSecondary,
            }),
        ],
    })
}

export default create('dark')
