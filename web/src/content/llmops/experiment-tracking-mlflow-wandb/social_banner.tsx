import React from 'react'
import {
    Column,
    ParetoChart,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    renderToPngWithOutput,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Experiment Tracking with MLflow and W&B. Track candidate thresholds along the safety-versus-abstention Pareto frontier with pinned dataset fingerprints, checkpoint hashes, and immutable prompt versions.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = { ...base, textMuted: base.textSecondary }

    return Scene({
        c,
        background: c.bg,
        padding: 40,
        gap: 24,
        contentWidth: 1120,
        children: [
            Row({
                justify: 'space-between',
                align: 'end',
                children: [
                    Column({
                        gap: 8,
                        align: 'start',
                        children: [
                            TextLabel({
                                c,
                                text: 'Experiment Tracking with MLflow & W&B',
                                fontSize: 42,
                                fontWeight: 800,
                                align: 'left',
                                color: c.textPrimary,
                            }),
                            TextLabel({
                                c,
                                text: 'Pin the dataset split, checkpoint digest, and scorer before ranking runs.',
                                fontSize: 22,
                                align: 'left',
                                color: c.textSecondary,
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'LeetLLM',
                        fontSize: 26,
                        fontWeight: 750,
                        color: c.primaryLight,
                    }),
                ],
            }),
            Row({
                gap: 28,
                align: 'center',
                children: [
                    ParetoChart({
                        c,
                        width: 620,
                        height: 390,
                        title: 'Router threshold frontier (split b54d7ceab650)',
                        xMin: 0,
                        xMax: 20,
                        yMin: 0,
                        yMax: 15,
                        xAxisLabel: 'Unsafe route rate (%)',
                        yAxisLabel: 'False abstain rate (%)',
                        xObjective: 'minimize',
                        yObjective: 'minimize',
                        showGrid: true,
                        showGoal: true,
                        goalLabel: '0, 0 target',
                        frontierColor: getReadableToneColor('green', c),
                        points: [
                            { x: 17.5, y: 3.3, label: 'underfit τ=0.45', color: getReadableToneColor('critical', c), size: 8 },
                            { x: 8.3, y: 2.5, label: 'loose τ=0.30', color: getReadableToneColor('warm', c), size: 8 },
                            { x: 1.7, y: 5.8, label: 'balanced τ=0.50', color: getReadableToneColor('green', c), size: 9 },
                            { x: 0.8, y: 10.8, label: 'strict τ=0.82', color: getReadableToneColor('blue', c), size: 8 },
                        ],
                    }),
                    Column({
                        gap: 20,
                        width: 460,
                        align: 'start',
                        children: [
                            TextLabel({
                                c,
                                text: 'Four invariants per candidate run',
                                fontSize: 26,
                                fontWeight: 750,
                                align: 'left',
                                color: c.textPrimary,
                            }),
                            TextLabel({
                                c,
                                text: '1. Evaluation split SHA-256 stays frozen across candidates.',
                                fontSize: 20,
                                color: c.textSecondary,
                                width: 450,
                            }),
                            TextLabel({
                                c,
                                text: '2. Model weights and threshold tau record separate IDs.',
                                fontSize: 20,
                                color: c.textSecondary,
                                width: 450,
                            }),
                            TextLabel({
                                c,
                                text: '3. Prompt aliases never overwrite pinned version numbers.',
                                fontSize: 20,
                                color: c.textSecondary,
                                width: 450,
                            }),
                            TextLabel({
                                c,
                                text: '4. Dominated and rejected runs remain searchable.',
                                fontSize: 20,
                                color: c.textPrimary,
                                width: 450,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
