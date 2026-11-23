import React from 'react'
import {
    Column,
    FlowArrow,
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
    'Greedy longest-match WordPiece on "rainbow" with fixed vocabulary {rainb, rain, ##bow} selects rainb first, finds no ##ow continuation, and outputs [UNK], leaving the valid rain + ##bow split unexplored.'

export const width = 640
export const height = 610
export const autoSize = false

function pieceChip(c: ReturnType<typeof getThemeColors>, text: string, tone: ToneName) {
    const color = getReadableToneColor(tone, c)
    return React.createElement(
        'div',
        {
            style: {
                padding: '8px 14px',
                borderRadius: 6,
                border: `1.5px solid ${color}`,
                backgroundColor: getToneFill(tone, c),
                color: c.textPrimary,
                fontFamily: c.fontMono,
                fontSize: 20,
                fontWeight: 700,
            },
        },
        text,
    )
}

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
                    text: 'WordPiece greedy search misses a valid split',
                    width: 592,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Panel({
                    c,
                    title: 'Input word: "rainbow"',
                    titleFontSize: 19,
                    width: 592,
                    padding: 14,
                    radius: 8,
                    tone: 'purple',
                    children: TextLabel({
                        c,
                        text: 'Fixed vocabulary: { rainb, rain, ##bow }',
                        mono: true,
                        fontSize: 19,
                        color: c.textPrimary,
                    }),
                }),
                Panel({
                    c,
                    title: 'Greedy path (actual encoder output)',
                    titleFontSize: 19,
                    width: 592,
                    padding: 16,
                    radius: 8,
                    tone: 'red',
                    children: Column({
                        width: 560,
                        gap: 12,
                        children: [
                            Row({
                                width: 560,
                                gap: 10,
                                align: 'center',
                                children: [
                                    pieceChip(c, 'rainb', 'red'),
                                    FlowArrow({ c, direction: 'right', length: 24, tone: 'red' }),
                                    pieceChip(c, 'no ##ow', 'warm'),
                                    FlowArrow({ c, direction: 'right', length: 24, tone: 'red' }),
                                    pieceChip(c, '[UNK]', 'red'),
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'Longest prefix rainb wins immediately; remaining "ow" fails and collapses the word.',
                                width: 560,
                                fontSize: 19,
                                color: c.textSecondary,
                            }),
                        ],
                    }),
                }),
                Panel({
                    c,
                    title: 'Valid path in vocabulary (never explored)',
                    titleFontSize: 19,
                    width: 592,
                    padding: 16,
                    radius: 8,
                    tone: 'green',
                    children: Column({
                        width: 560,
                        gap: 12,
                        children: [
                            Row({
                                width: 560,
                                gap: 10,
                                align: 'center',
                                children: [
                                    pieceChip(c, 'rain', 'green'),
                                    FlowArrow({ c, direction: 'right', length: 28, tone: 'green' }),
                                    pieceChip(c, '##bow', 'green'),
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'WordPiece does not backtrack once rainb commits, so rain + ##bow is never tried.',
                                width: 560,
                                fontSize: 19,
                                color: c.textSecondary,
                            }),
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create('dark')
