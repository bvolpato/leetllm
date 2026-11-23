import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 560
export const height = 650
export const alt =
    'A toy SAE training trace plots reconstruction MSE 1.4259, 0.2370, 0.1564 and weighted L1 contribution 0.5167, 0.2931, 0.2830 at epochs 0, 100, 200. The completed 300-epoch run reports MSE 0.128 and 18.9 active latents of 64; held-out results are MSE 0.128, FVU 0.169, and 19.5 active latents. Median best absolute cosine against known generating directions changes only from 0.798 to 0.799.'

const plot = {
    x: 92,
    y: 4,
    width: 420,
    height: 208,
    padding: 32,
    xMin: 0,
    xMax: 2,
    yMin: 0,
    yMax: 1.6,
}
const plotInnerWidth = plot.width - 2 * plot.padding
const plotInnerHeight = plot.height - 2 * plot.padding
const xAt = (value: number) =>
    plot.x + plot.padding + ((value - plot.xMin) / (plot.xMax - plot.xMin)) * plotInnerWidth
const yAt = (value: number) =>
    plot.y + plot.padding + ((plot.yMax - value) / (plot.yMax - plot.yMin)) * plotInnerHeight

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    width: number,
    color = c.textPrimary,
    fontSize = 19,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
): React.ReactElement {
    return CanvasItem({
        x,
        y,
        width,
        height: Math.ceil(fontSize * 1.4),
        children: TextLabel({ c, text, width, color, fontSize, fontWeight: 650, align, mono }),
    })
}

function checkpointPlot(c: ThemeColors): React.ReactElement {
    const mse = getReadableToneColor('green', c, c.bg, c.bg)
    const sparsity = getReadableToneColor('warm', c, c.bg, c.bg)
    return Board({
        c,
        width: 560,
        height: 282,
        children: [
            CanvasItem({
                x: plot.x,
                y: plot.y,
                width: plot.width,
                height: plot.height,
                children: AxisPlot({
                    c,
                    width: plot.width,
                    height: plot.height,
                    padding: plot.padding,
                    xMin: plot.xMin,
                    xMax: plot.xMax,
                    yMin: plot.yMin,
                    yMax: plot.yMax,
                    showFrame: false,
                    showAxes: true,
                    showGrid: true,
                    gridCount: 3,
                    paths: [
                        {
                            points: [
                                { x: 0, y: 1.4259 },
                                { x: 1, y: 0.237 },
                                { x: 2, y: 0.1564 },
                            ],
                            color: mse,
                            strokeWidth: 5,
                        },
                        {
                            points: [
                                { x: 0, y: 0.5167 },
                                { x: 1, y: 0.2931 },
                                { x: 2, y: 0.283 },
                            ],
                            color: sparsity,
                            strokeWidth: 5,
                        },
                    ],
                }),
            }),
            ...[0, 0.5, 1, 1.5].map((value) =>
                label(
                    c,
                    value.toFixed(1),
                    10,
                    yAt(value) - 12,
                    48,
                    c.textSecondary,
                    19,
                    'right',
                    true,
                ),
            ),
            ...[
                { x: 0, text: '0' },
                { x: 1, text: '100' },
                { x: 2, text: '200' },
            ].map(({ x, text }) =>
                label(c, text, xAt(x) - 28, 178, 56, c.textSecondary, 20, 'center', true),
            ),
            label(c, 'epoch', 246, 204, 72, c.textSecondary, 20, 'center'),
            label(c, 'MSE', 12, 224, 60, mse, 20, 'left', true),
            label(c, '1.4259', xAt(0) - 42, 224, 84, c.textPrimary, 20, 'center', true),
            label(c, '0.2370', xAt(1) - 42, 224, 84, c.textPrimary, 20, 'center', true),
            label(c, '0.1564', xAt(2) - 42, 224, 84, c.textPrimary, 20, 'center', true),
            label(c, 'λL1', 12, 250, 60, sparsity, 20, 'left', true),
            label(c, '0.5167', xAt(0) - 42, 250, 84, c.textPrimary, 20, 'center', true),
            label(c, '0.2931', xAt(1) - 42, 250, 84, c.textPrimary, 20, 'center', true),
            label(c, '0.2830', xAt(2) - 42, 250, 84, c.textPrimary, 20, 'center', true),
        ],
    })
}

function metric(c: ThemeColors, name: string, value: string, color: string): React.ReactElement {
    return Column({
        width: 262,
        gap: 3,
        align: 'center',
        children: [
            TextLabel({
                c,
                text: name,
                width: 262,
                fontSize: 19,
                color: c.textSecondary,
                fontWeight: 650,
                align: 'center',
            }),
            TextLabel({
                c,
                text: value,
                width: 262,
                fontSize: 24,
                color,
                fontWeight: 750,
                align: 'center',
                mono: true,
            }),
        ],
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const mse = getReadableToneColor('green', c, c.bg, c.bg)
    const alignment = getReadableToneColor('purple', c, c.bg, c.bg)
    return Scene({
        c,
        title: 'Reconstruction improves; alignment stays flat',
        subtitle: 'Toy SAE · separate the objective checkpoints from end-of-run diagnostics',
        padding: 10,
        gap: 8,
        align: 'center',
        contentWidth: 560,
        children: Column({
            width: 560,
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Objective: MSE + 5.0 × mean(|z|)',
                    width: 540,
                    fontSize: 22,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                    mono: true,
                }),
                TextLabel({
                    c,
                    text: 'Checkpoint contributions · epochs 0, 100, 200',
                    width: 540,
                    fontSize: 19,
                    color: c.textSecondary,
                    align: 'center',
                }),
                checkpointPlot(c),
                TextLabel({
                    c,
                    text: 'Full 300-epoch run and held-out check',
                    width: 540,
                    fontSize: 21,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Row({
                    width: 540,
                    gap: 12,
                    justify: 'center',
                    align: 'center',
                    children: [
                        metric(c, 'final train MSE', '1.426 → 0.128', mse),
                        metric(c, 'median best |cos|', '0.798 → 0.799', alignment),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Active latents: 18.9/64 train · 19.5/64 held out · FVU 0.169',
                    width: 540,
                    fontSize: 19,
                    color: c.textSecondary,
                    align: 'center',
                    mono: true,
                }),
            ],
        }),
    })
}

export default create('dark')
