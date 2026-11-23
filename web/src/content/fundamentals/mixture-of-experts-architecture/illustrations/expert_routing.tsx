import React from 'react'
import {
    BarChart,
    Column,
    Grid,
    Panel,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 580
export const height = 600
export const alt =
    'Batch assignment histogram for 20 token routes across four experts: E0 receives 12 assignments (60%), E1 receives 4 (20%), E2 receives 3 (15%), and E3 receives 1 (5%), alongside the uniform 25% reference and 50% batch alert threshold.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    const hot = getReadableToneColor('warm', c)
    const active = getReadableToneColor('blue', c)
    const cool = getReadableToneColor('purple', c)
    const low = getReadableToneColor('neutral', c)
    const slotTone = (i: number) =>
        i < 12
            ? { label: 'E0', tone: 'warm' as const }
            : i < 16
              ? { label: 'E1', tone: 'blue' as const }
              : i < 19
                ? { label: 'E2', tone: 'purple' as const }
                : { label: 'E3', tone: 'neutral' as const }

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 556,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Routing share across 20 batch assignments',
                    titleFontSize: 20,
                    width: 552,
                    padding: 14,
                    children: BarChart({
                        c: cd,
                        width: 520,
                        height: 210,
                        min: 0,
                        max: 0.75,
                        format: 'percent',
                        showGrid: true,
                        showValues: true,
                        data: [
                            { label: 'E0 (12)', value: 0.6, color: hot, valueLabel: '60%' },
                            { label: 'E1 (4)', value: 0.2, color: active, valueLabel: '20%' },
                            { label: 'E2 (3)', value: 0.15, color: cool, valueLabel: '15%' },
                            { label: 'E3 (1)', value: 0.05, color: low, valueLabel: '5%' },
                        ],
                    }),
                }),
                Panel({
                    c: cd,
                    title: 'Token slots by expert vs 25% uniform target',
                    titleFontSize: 20,
                    width: 552,
                    padding: 14,
                    gap: 8,
                    children: [
                        Grid({
                            c: cd,
                            rows: [0, 1].map((r) =>
                                Array.from({ length: 10 }, (_, col) => slotTone(r * 10 + col)),
                            ),
                            cellWidth: 46,
                            cellHeight: 36,
                            gap: 5,
                            fontSize: 18,
                        }),
                        TextLabel({
                            c,
                            text: 'Uniform target: 5 per expert (25%). E0 hits 60% (>50% batch alert).',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
