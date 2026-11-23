import React from 'react'
import {
    BadgePill,
    Column,
    Matrix,
    Panel,
    Row,
    Scene,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

const DENSITY = 2.5

export const width = 860
export const height = 740
export const alt =
    'Visibility matrices for latest-token decode: upper-left causal masking hides k1 and k2 (mean 1.0), explicit full-prefix visibility recovers 4.0, and a two-query chunk requires per-row cutoffs so q3 never attends to k4.'

function makeLatestQueryVisibility(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const upperLeftPanel = Panel({
        c,
        title: '1-Row is_causal=True',
        subtitle: 'Upper-left drops k1, k2',
        tone: 'red',
        titleFontSize: 29,
        padding: 12,
        gap: 8,
        width: 392,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                Matrix({
                    c,
                    data: [[1.0, 0.0, 0.0]],
                    labels: [['1.00', '×', '×']],
                    rowLabels: ['q2'],
                    colLabels: ['k0(1)', 'k1(2)', 'k2(9)'],
                    cellWidth: 82,
                    cellHeight: 48,
                    rowLabelWidth: 50,
                    fontSize: 26,
                    colorScale: 'strength',
                }),
                BadgePill({ c, tone: 'red', text: 'Out = 1.0 (wrong)', fontSize: 26 }),
            ],
        }),
    })

    const fullPrefixPanel = Panel({
        c,
        title: '1-Row Full Prefix',
        subtitle: 'is_causal=False · 1 latest query',
        tone: 'green',
        titleFontSize: 29,
        padding: 12,
        gap: 8,
        width: 392,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                Matrix({
                    c,
                    data: [[0.33, 0.33, 0.33]],
                    labels: [['0.33', '0.33', '0.33']],
                    rowLabels: ['q2'],
                    colLabels: ['k0(1)', 'k1(2)', 'k2(9)'],
                    cellWidth: 82,
                    cellHeight: 48,
                    rowLabelWidth: 50,
                    fontSize: 26,
                    colorScale: 'strength',
                    colorDomain: [0, 0.45],
                }),
                BadgePill({ c, tone: 'green', text: 'Out = 4.0 (exact)', fontSize: 26 }),
            ],
        }),
    })

    const chunkPanel = Panel({
        c,
        title: '2-Query Chunk [q3, q4] Causal Visibility',
        subtitle: 'Per-query cutoff blocks future key k4 for q3',
        tone: 'blue',
        titleFontSize: 29,
        padding: 12,
        gap: 10,
        width: 800,
        children: Matrix({
            c,
            data: [
                [0.25, 0.25, 0.25, 0.25, 0.0],
                [0.2, 0.2, 0.2, 0.2, 0.2],
            ],
            labels: [
                ['0.25', '0.25', '0.25', '0.25', '×'],
                ['0.20', '0.20', '0.20', '0.20', '0.20'],
            ],
            rowLabels: ['q3', 'q4'],
            colLabels: ['k0', 'k1', 'k2', 'k3', 'k4'],
            cellWidth: 96,
            cellHeight: 44,
            rowLabelWidth: 54,
            fontSize: 26,
            colorScale: 'strength',
            colorDomain: [0, 0.35],
            highlightCell: { row: 0, col: 4 },
            highlightColor: c.critical,
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 14,
        gap: 12,
        contentWidth: 800,
        children: Column({
            gap: 12,
            children: [
                Row({ gap: 16, align: 'stretch', children: [upperLeftPanel, fullPrefixPanel] }),
                chunkPanel,
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeLatestQueryVisibility(theme)
}

export default create('dark')
