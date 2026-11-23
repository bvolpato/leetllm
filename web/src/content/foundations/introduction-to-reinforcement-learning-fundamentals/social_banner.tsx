import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
    Grid,
    Panel,
    Row,
    TextLabel,
    getThemeColors,
    renderToPng,
    withDensity,
} from 'vizmatic'

export const width = 1200
export const height = 630

export const alt =
    'Reinforcement Learning Basics: MDPs, Bellman backups, Q-learning, and policy gradients on a 3 by 4 cliff gridworld.'

export function BannerScene() {
    const c = withDensity(getThemeColors('dark'), 1.35)
    return React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: c.bg,
                padding: 36,
            },
        },
        Column({
            gap: 22,
            width: '100%',
            height: '100%',
            justify: 'space-between',
            children: [
                Row({
                    gap: 16,
                    width: '100%',
                    align: 'center',
                    justify: 'space-between',
                    children: [
                        Column({
                            gap: 6,
                            align: 'start',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Reinforcement Learning Basics',
                                    fontSize: 42,
                                    fontWeight: 700,
                                    color: c.textPrimary,
                                }),
                                TextLabel({
                                    c,
                                    text: 'MDPs, Bellman backups, Q-learning, and policy gradients on a 3x4 cliff gridworld',
                                    fontSize: 21,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                        BadgePill({
                            c,
                            text: 'LeetLLM',
                            tone: 'purple',
                            filled: true,
                            fontSize: 22,
                            height: 44,
                            padding: '0 18px',
                        }),
                    ],
                }),
                Row({
                    gap: 24,
                    width: '100%',
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: '3x4 Cliff Gridworld (gamma = 0.90)',
                            tone: 'blue',
                            width: 550,
                            padding: 18,
                            gap: 12,
                            children: [
                                Grid({
                                    c,
                                    cellWidth: 120,
                                    cellHeight: 72,
                                    gap: 8,
                                    fontSize: 20,
                                    rows: [
                                        [
                                            { label: '0,0 ->', tone: 'neutral' },
                                            { label: '0,1 ->', tone: 'neutral' },
                                            { label: '0,2 ->', tone: 'neutral' },
                                            { label: '0,3 v', tone: 'neutral' },
                                        ],
                                        [
                                            { label: 'Start 1,0', tone: 'blue' },
                                            { label: '1,1 ^', tone: 'warm' },
                                            { label: '1,2 ^', tone: 'warm' },
                                            { label: '1,3 v', tone: 'neutral' },
                                        ],
                                        [
                                            { label: 'Cliff -50', tone: 'red' },
                                            { label: 'Cliff -50', tone: 'red' },
                                            { label: 'Cliff -50', tone: 'red' },
                                            { label: 'Goal +20', tone: 'green' },
                                        ],
                                    ],
                                }),
                                TextLabel({
                                    c,
                                    text: 'Step cost -1; slip risk shifts optimal route to upper ridge',
                                    fontSize: 18,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                        Panel({
                            c,
                            title: 'Q*((1,1), a) under 0.20 slip',
                            tone: 'purple',
                            width: 550,
                            padding: 18,
                            gap: 12,
                            children: [
                                BarChart({
                                    c,
                                    width: 506,
                                    height: 235,
                                    min: -52,
                                    max: 16,
                                    showValues: true,
                                    format: (v: number) => v.toFixed(1),
                                    data: [
                                        { label: 'Up', value: 6.31, color: 'green' },
                                        { label: 'Right', value: 1.59, color: 'warm' },
                                        { label: 'Down', value: -38.97, color: 'critical' },
                                        { label: 'Left', value: -2.05, color: 'cyan' },
                                    ],
                                }),
                                TextLabel({
                                    c,
                                    text: 'Det. Right (+14.3) -> Stochastic Up (+6.3)',
                                    fontSize: 18,
                                    mono: true,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    )
}

export async function renderBanner(outputPath: string) {
    await renderToPng(React.createElement(BannerScene), { width, height, theme: 'dark', outputPath })
}
