import React from 'react'
import {
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const alt =
    'Four token pieces rain, ·falls, ·soft, and ly receive model-local IDs 2, 5, 1, and 6. Each integer gathers the corresponding row from an 8-by-3 embedding table in token order to form the 4-by-3 model input tensor.'

export const width = 640
export const height = 660
export const autoSize = false

const TOKENS: Array<{ piece: string; id: number; tone: ToneName; row: string }> = [
    { piece: 'rain', id: 2, tone: 'blue', row: '[0.8, -0.1, 0.3]' },
    { piece: '·falls', id: 5, tone: 'cyan', row: '[-0.4, 0.7, 0.2]' },
    { piece: '·soft', id: 1, tone: 'purple', row: '[0.2, 0.5, -0.6]' },
    { piece: 'ly', id: 6, tone: 'warm', row: '[0.1, -0.3, 0.9]' },
]

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    return Scene({
        c,
        contentWidth: 592,
        padding: 24,
        gap: 14,
        children: Column({
            width: 592,
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Token IDs select rows from the embedding matrix',
                    width: 592,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Panel({
                    c,
                    title: '1. Text -> 4 pieces -> integer row IDs [2, 5, 1, 6]',
                    titleFontSize: 19,
                    width: 592,
                    padding: 14,
                    radius: 8,
                    tone: 'purple',
                    children: Row({
                        width: 564,
                        gap: 10,
                        justify: 'center',
                        children: TOKENS.map((t) => {
                            const color = getReadableToneColor(t.tone, c)
                            return React.createElement(
                                'div',
                                {
                                    key: t.id,
                                    style: {
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        border: `1.5px solid ${color}`,
                                        backgroundColor: getToneFill(t.tone, c),
                                        color: c.textPrimary,
                                        fontFamily: c.fontMono,
                                        fontSize: 19,
                                        fontWeight: 700,
                                    },
                                },
                                `${t.piece} -> ${t.id}`,
                            )
                        }),
                    }),
                }),
                Row({
                    width: 592,
                    gap: 10,
                    justify: 'center',
                    align: 'center',
                    children: [
                        FlowArrow({ c, direction: 'down', length: 20, tone: 'purple' }),
                        TextLabel({
                            c,
                            text: '2. Gather E[ids] from 8×3 table in token order',
                            fontSize: 19,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                    ],
                }),
                Grid({
                    c,
                    rows: [
                        ['Pos · Piece -> Row ID', 'Gathered row vector in E[ids]'],
                        ...TOKENS.map((t, pos) => [
                            { label: `pos ${pos}: ${t.piece} -> row ${t.id}`, tone: t.tone },
                            { label: t.row, tone: t.tone },
                        ]),
                    ],
                    cellWidth: 288,
                    cellHeight: 50,
                    gap: 6,
                    fontSize: 19,
                    headerRows: 1,
                }),
                TextLabel({
                    c,
                    text: 'Rows 0, 3, 4, 7 stay unused here; gathered output matrix shape is (4, 3).',
                    width: 592,
                    fontSize: 19,
                    align: 'center',
                    color: c.textSecondary,
                }),
            ],
        }),
    })
}

export default create('dark')
