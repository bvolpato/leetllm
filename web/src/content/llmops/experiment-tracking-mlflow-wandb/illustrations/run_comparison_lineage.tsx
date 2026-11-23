import React from 'react'
import { Column, GraphDiagram, Scene, TextLabel, getThemeColors, withDensity } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 760
export const height = 740
export const autoSize = false
export const opaqueBackground = true
export const alt =
    'A left-to-right lineage diagram traces how code commit and seed, frozen evaluation split b54d7ceab650, checkpoint SHA 62df2fcb552b, and evaluator route-eval-v2 at prompt version 2 combine into a comparable balanced candidate run (F1 0.901, unsafe route rate 1.7%). Two other runs are flagged as non-comparable on the leaderboard: one altered the evaluation split digest (F1 0.928) and the other changed the evaluator version to eval-v3 (F1 0.915).'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const raw = theme === 'light' ? { ...base, textMuted: base.textSecondary } : base
    const c = withDensity({ ...raw, shadow: 'transparent' }, 2.4)

    return Scene({
        c: raw,
        background: raw.bg,
        padding: 12,
        gap: 8,
        contentWidth: 736,
        align: 'stretch',
        children: [
            Column({
                gap: 4,
                align: 'start',
                children: [
                    TextLabel({
                        c,
                        text: 'Direct run comparison requires matching inputs, checkpoint, and scorer',
                        fontSize: 24,
                        fontWeight: 750,
                        align: 'left',
                        color: raw.textPrimary,
                    }),
                    TextLabel({
                        c,
                        text: 'A higher score caused by a changed split or unpinned judge prompt invalidates ranking',
                        fontSize: 23,
                        align: 'left',
                        color: raw.textSecondary,
                    }),
                ],
            }),
            GraphDiagram({
                c,
                width: 736,
                height: 480,
                layout: 'auto',
                direction: 'LR',
                routing: 'orthogonal',
                nodeWidth: 214,
                nodeHeight: 96,
                nodeGap: 14,
                rankGap: 20,
                padding: 8,
                labelFontSize: 23,
                detailFontSize: 23,
                arrowSize: 6,
                legend: false,
                ariaLabel: 'Lineage prerequisites and run comparability checks',
                nodes: [
                    {
                        id: 'code',
                        label: 'Code + seed',
                        detail: 'git 4a9e2b, seed 7',
                        tone: 'blue',
                    },
                    {
                        id: 'split',
                        label: 'Eval split SHA',
                        detail: 'val_v2 b54d7cea',
                        tone: 'blue',
                    },
                    {
                        id: 'weights',
                        label: 'Checkpoint SHA',
                        detail: '62df2fcb (a=0.005)',
                        tone: 'purple',
                    },
                    {
                        id: 'scorer',
                        label: 'Pinned evaluator',
                        detail: 'route-eval-v2 p2',
                        tone: 'purple',
                    },
                    {
                        id: 'valid',
                        label: 'balanced (τ=0.5)',
                        detail: 'F1 0.901 (valid)',
                        tone: 'green',
                    },
                    {
                        id: 'split_drift',
                        label: 'Split drifted',
                        detail: 'F1 0.928 (new SHA)',
                        tone: 'critical',
                    },
                    {
                        id: 'eval_drift',
                        label: 'Scorer drifted',
                        detail: 'F1 0.915 (eval-v3)',
                        tone: 'warm',
                    },
                ],
                edges: [
                    { from: 'code', to: 'weights', kind: 'data', tone: 'blue' },
                    { from: 'split', to: 'scorer', kind: 'dependency', tone: 'blue' },
                    {
                        from: 'weights',
                        to: 'valid',
                        kind: 'data',
                        tone: 'green',
                        emphasis: true,
                    },
                    { from: 'scorer', to: 'valid', kind: 'dependency', tone: 'green' },
                    {
                        from: 'split',
                        to: 'split_drift',
                        kind: 'event',
                        style: 'dashed',
                        tone: 'critical',
                    },
                    {
                        from: 'scorer',
                        to: 'eval_drift',
                        kind: 'event',
                        style: 'dashed',
                        tone: 'warm',
                    },
                ],
            }),
        ],
    })
}

export default create('dark')
