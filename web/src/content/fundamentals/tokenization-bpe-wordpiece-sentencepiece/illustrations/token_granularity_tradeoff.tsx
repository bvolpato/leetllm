import React from 'react'
import {
    Column,
    FlowArrow,
    Panel,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const alt =
    'Granularity comparison on "rain falls softly" (17 characters): characters take 17 positions (289 dense attention cells), subwords take 4 pieces (16 cells), and whole words take 3 pieces (9 cells, risking [UNK] on unseen words).'

export const width = 640
export const height = 740
export const autoSize = false

function pieceBadges(c: ReturnType<typeof getThemeColors>, pieces: string[], tone: ToneName) {
    const color = getReadableToneColor(tone, c)
    return Row({
        gap: 6,
        justify: 'start',
        children: pieces.map((piece, idx) =>
            React.createElement(
                'div',
                {
                    key: `${piece}-${idx}`,
                    style: {
                        padding: '4px 8px',
                        borderRadius: 5,
                        border: `1.5px solid ${color}`,
                        backgroundColor: getToneFill(tone, c),
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 19,
                        fontWeight: 650,
                    },
                },
                piece,
            ),
        ),
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)

    return Scene({
        c,
        contentWidth: 600,
        padding: 20,
        gap: 10,
        children: Column({
            width: 600,
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Granularity controls sequence length and N² cost',
                    width: 600,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Example string: "rain falls softly" (17 characters)',
                    width: 600,
                    fontSize: 19,
                    align: 'center',
                    color: c.textSecondary,
                }),
                Panel({
                    c,
                    title: 'Characters · 17 positions -> 289 cells/head',
                    titleFontSize: 19,
                    width: 600,
                    padding: 12,
                    radius: 8,
                    tone: 'red',
                    children: TextLabel({
                        c,
                        text: 'r|a|i|n|·|f|a|l|l|s|·|s|o|f|t|l|y (tiny vocab, long sequence)',
                        mono: true,
                        fontSize: 19,
                        color: c.textPrimary,
                    }),
                }),
                Panel({
                    c,
                    title: 'Subwords · 4 pieces -> 16 cells/head',
                    titleFontSize: 19,
                    width: 600,
                    padding: 12,
                    radius: 8,
                    tone: 'green',
                    children: pieceBadges(c, ['rain', '·falls', '·soft', 'ly'], 'green'),
                }),
                Panel({
                    c,
                    title: 'Whole words · 3 pieces -> 9 cells (unseen words -> [UNK])',
                    titleFontSize: 19,
                    width: 600,
                    padding: 12,
                    radius: 8,
                    tone: 'blue',
                    children: pieceBadges(c, ['rain', 'falls', 'softly'], 'blue'),
                }),
                Row({
                    width: 600,
                    gap: 10,
                    justify: 'center',
                    align: 'center',
                    children: [
                        FlowArrow({ c, direction: 'down', length: 18, tone: 'purple' }),
                        TextLabel({
                            c,
                            text: 'Sequence length enters dense attention quadratically',
                            fontSize: 19,
                            fontWeight: 700,
                            color: purple,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Dense attention cells per head (N², 0 to 300 scale)',
                    titleFontSize: 19,
                    width: 600,
                    padding: 14,
                    radius: 8,
                    tone: 'purple',
                    children: ProgressList({
                        c,
                        labelWidth: 165,
                        valueWidth: 125,
                        barHeight: 20,
                        fontSize: 19,
                        gap: 10,
                        rows: [
                            {
                                label: 'Chars (N=17)',
                                value: 289 / 300,
                                valueLabel: '289 cells',
                                tone: 'red',
                            },
                            {
                                label: 'Subwords (N=4)',
                                value: 16 / 300,
                                valueLabel: '16 cells',
                                tone: 'green',
                            },
                            {
                                label: 'Words (N=3)',
                                value: 9 / 300,
                                valueLabel: '9 cells',
                                tone: 'blue',
                            },
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create('dark')
