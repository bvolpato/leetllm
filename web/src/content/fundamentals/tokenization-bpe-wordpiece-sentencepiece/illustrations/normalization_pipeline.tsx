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
    'Composed café (4 code points, 5 UTF-8 bytes) and decomposed cafe plus U+0301 (5 code points, 6 bytes) both map to composed café under NFC and NFKC. The ligature ﬁle (3 code points, 5 bytes) remains ﬁle under NFC and expands to four ASCII letters under NFKC.'

export const width = 640
export const height = 700
export const autoSize = false

function codeCells(c: ReturnType<typeof getThemeColors>, points: string[], tone: ToneName) {
    const color = getReadableToneColor(tone, c)
    return Row({
        gap: 4,
        align: 'center',
        children: points.map((pt, i) =>
            React.createElement(
                'div',
                {
                    key: `${pt}-${i}`,
                    style: {
                        minWidth: 32,
                        padding: '4px 8px',
                        borderRadius: 5,
                        border: `1.5px solid ${color}`,
                        backgroundColor: getToneFill(tone, c),
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 19,
                        fontWeight: 700,
                        textAlign: 'center',
                    },
                },
                pt,
            ),
        ),
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c,
        contentWidth: 592,
        padding: 24,
        gap: 12,
        children: Column({
            width: 592,
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Unicode NFC merges accents; NFKC rewrites ligatures',
                    width: 592,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Panel({
                    c,
                    title: 'Composed café · 4 code points, 5 UTF-8 bytes',
                    titleFontSize: 19,
                    width: 592,
                    padding: 14,
                    radius: 8,
                    tone: 'blue',
                    children: Row({
                        width: 564,
                        gap: 10,
                        align: 'center',
                        children: [
                            codeCells(c, ['c', 'a', 'f', 'é'], 'blue'),
                            FlowArrow({ c, direction: 'right', length: 24, tone: 'blue' }),
                            TextLabel({
                                c,
                                text: 'NFC & NFKC: café (4 pts)',
                                fontSize: 19,
                                fontWeight: 650,
                                color: c.textPrimary,
                            }),
                        ],
                    }),
                }),
                Panel({
                    c,
                    title: 'Decomposed cafe + U+0301 · 5 code points, 6 UTF-8 bytes',
                    titleFontSize: 19,
                    width: 592,
                    padding: 14,
                    radius: 8,
                    tone: 'cyan',
                    children: Row({
                        width: 564,
                        gap: 10,
                        align: 'center',
                        children: [
                            codeCells(c, ['c', 'a', 'f', 'e', 'U+0301'], 'cyan'),
                            FlowArrow({ c, direction: 'right', length: 18, tone: 'cyan' }),
                            TextLabel({
                                c,
                                text: 'NFC & NFKC: café (4 pts)',
                                fontSize: 19,
                                fontWeight: 650,
                                color: c.textPrimary,
                            }),
                        ],
                    }),
                }),
                Panel({
                    c,
                    title: 'Ligature ﬁle · 3 code points, 5 UTF-8 bytes',
                    titleFontSize: 19,
                    width: 592,
                    padding: 14,
                    radius: 8,
                    tone: 'red',
                    children: Column({
                        width: 564,
                        gap: 10,
                        children: [
                            Row({
                                width: 564,
                                gap: 10,
                                align: 'center',
                                children: [
                                    codeCells(c, ['ﬁ', 'l', 'e'], 'red'),
                                    FlowArrow({ c, direction: 'right', length: 22, tone: 'red' }),
                                    TextLabel({
                                        c,
                                        text: 'NFC keeps ﬁle (3 pts)',
                                        fontSize: 19,
                                        fontWeight: 650,
                                        color: c.textPrimary,
                                    }),
                                ],
                            }),
                            Row({
                                width: 564,
                                gap: 10,
                                align: 'center',
                                children: [
                                    codeCells(c, ['f', 'i', 'l', 'e'], 'warm'),
                                    FlowArrow({ c, direction: 'right', length: 22, tone: 'warm' }),
                                    TextLabel({
                                        c,
                                        text: 'NFKC splits ﬁ -> f + i (4 pts)',
                                        fontSize: 19,
                                        fontWeight: 750,
                                        color: warm,
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                TextLabel({
                    c,
                    text: 'NFKC erases spelling differences before BPE/Unigram lookup; neither output records which spelling arrived.',
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
