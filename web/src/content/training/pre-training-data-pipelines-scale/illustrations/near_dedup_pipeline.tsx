import React, { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 860
export const height = 540
export const alt =
    'Actual replay of the lesson three-document MinHash example. A and B share six word bigrams and have four differing bigrams in their ten-bigram union. Their 32-row signatures match in zero-based bands 1 and 3. In band 1, salts 4 through 7 select the same minimizing bigrams and identical full 64-bit hash values. Exact verification gives Jaccard 6/10, or 0.60, passing the 0.50 threshold. The verified A–B component keeps A and drops B; the separate C component keeps C.'

export const documents = [
    { id: 'A', text: 'The key policy says stale accounts need security review.' },
    { id: 'B', text: 'The key policy says stale accounts require security review.' },
    { id: 'C', text: 'Audit logs record deployment rollback events.' },
]
const bigrams = (text: string) => {
    const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
    return new Set(tokens.slice(0, -1).map((token, i) => token + ' ' + tokens[i + 1]))
}
export const shingleSets = documents.map((doc) => ({ id: doc.id, values: bigrams(doc.text) }))
export const shared = [...shingleSets[0].values].filter((value) => shingleSets[1].values.has(value))
export const differences = shingleSets
    .slice(0, 2)
    .map((row, i) => [...row.values].filter((value) => !shingleSets[1 - i].values.has(value)))
export const unionSize = new Set([...shingleSets[0].values, ...shingleSets[1].values]).size
export const jaccard = shared.length / unionSize
export const threshold = 0.5
export const signatureHex: Record<string, string[]> = {
    A: [
        '442944f914abe43a',
        '030b62d21ca622c1',
        '03f62a6f76564f70',
        '16bd27d148c790fb',
        '109f7012a5dd0c28',
        '0b0b05eb97d540f4',
        '0dddf4b7179f16b3',
        '043df96cd35df552',
        '0870ab55fc4e86bd',
        '2de9c7ae7cfb966c',
        '32a24819ca32196c',
        '3bb939ec3bc84a6c',
        '46ce182535e00dd1',
        '351f99d7e846b9b1',
        '08f4ffeb2a8bf6dc',
        '3e1fe3771f5742c3',
        '1c09f257ca82f3db',
        '3c3a7489d4296b71',
        '179f2ea7a30df93c',
        '140c8ec82eb90862',
        '110d1aa14445f44a',
        '0620dc0a35dc4658',
        '0a5fe9d776ab6504',
        '2482e5263d92e7e6',
        '1b883da26a1fbfb5',
        '043e09e16fa8ca61',
        '117653bd308ee0ee',
        '02091938c703dea9',
        '15344ea199d41e29',
        '066882939d6d4d91',
        '2eadf8708eaf6aa7',
        '12104869ca3ee5a5',
    ],
    B: [
        '141f72d074f525fc',
        '030b62d21ca622c1',
        '03f62a6f76564f70',
        '19f877c049ec7aa7',
        '109f7012a5dd0c28',
        '0b0b05eb97d540f4',
        '0dddf4b7179f16b3',
        '043df96cd35df552',
        '1887e2c4ecbb890f',
        '2de9c7ae7cfb966c',
        '32a24819ca32196c',
        '0aed0ea465399a65',
        '46ce182535e00dd1',
        '351f99d7e846b9b1',
        '08f4ffeb2a8bf6dc',
        '3e1fe3771f5742c3',
        '1c09f257ca82f3db',
        '18466055fb2c82c0',
        '179f2ea7a30df93c',
        '140c8ec82eb90862',
        '13bbca4a467c46b1',
        '0620dc0a35dc4658',
        '0a5fe9d776ab6504',
        '2482e5263d92e7e6',
        '0d33c5eab805813d',
        '097eb351b88f7f75',
        '117653bd308ee0ee',
        '02091938c703dea9',
        '15344ea199d41e29',
        '066882939d6d4d91',
        '2eadf8708eaf6aa7',
        '12104869ca3ee5a5',
    ],
}

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const muted = c.textSecondary

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Left Panel (Shingling & LSH)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 400,
            height: 430,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Right Panel (Verification & Clustering)
        SvgFrame({
            c,
            x: 440,
            y: 50,
            width: 400,
            height: 430,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        // Left Panel Subcards
        SvgFrame({
            c,
            x: 35,
            y: 110,
            width: 370,
            height: 100,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-shingles',
        }),
        SvgFrame({
            c,
            x: 35,
            y: 225,
            width: 370,
            height: 130,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: cyan,
            strokeWidth: 1.5,
            key: 'card-lsh',
        }),
        // Connecting Arrow
        VectorArrow({
            x1: 220,
            y1: 365,
            x2: 220,
            y2: 395,
            color: cyan,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Cluster Graph in Right Panel
        SvgFrame({
            c,
            x: 460,
            y: 110,
            width: 360,
            height: 175,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-cluster-graph',
        }),
        // Cluster A-B Nodes
        SvgFrame({
            c,
            x: 490,
            y: 155,
            width: 80,
            height: 50,
            rx: 6,
            fill: cyan,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'node-A',
        }),
        SvgFrame({
            c,
            x: 620,
            y: 155,
            width: 80,
            height: 50,
            rx: 6,
            fill: warm,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'node-B',
        }),
        SvgFrame({
            c,
            x: 730,
            y: 155,
            width: 70,
            height: 50,
            rx: 6,
            fill: cyan,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'node-C',
        }),
        // Edge between A and B
        VectorArrow({
            x1: 572,
            y1: 180,
            x2: 618,
            y2: 180,
            color: cyan,
            strokeWidth: 2.5,
            arrowSize: 0,
        }),
        // Decision Card
        SvgFrame({
            c,
            x: 460,
            y: 300,
            width: 360,
            height: 165,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: cyan,
            strokeWidth: 1.5,
            key: 'card-decision',
        }),
    )

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                {shapeSvg}
            </CanvasItem>
            {label(
                c,
                'Near-Deduplication: MinHash, LSH Bands, and Exact Verification',
                20,
                12,
                width - 40,
                30,
                22,
                c.textPrimary,
                'center',
            )}

            {/* Left Panel */}
            {label(c, '1. Shingling & MinHash LSH Indexing', 35, 62, 370, 24, 16, c.textPrimary)}
            {label(c, 'Three-document walkthrough with 32 hash rows', 35, 86, 370, 20, 12, muted)}

            {label(c, 'Word Bigram Overlap (Doc A vs Doc B)', 45, 116, 350, 20, 13, c.textPrimary)}
            {label(
                c,
                '• 6 Shared: "the key", "key policy", "says stale", ...',
                45,
                138,
                350,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                '• 4 Differing: "accounts need" vs "accounts require"',
                45,
                158,
                350,
                18,
                11,
                muted,
            )}
            {label(
                c,
                'Exact Jaccard = 6 / 10 = 0.60 (Target threshold: 0.50)',
                45,
                180,
                350,
                20,
                12,
                purple,
            )}

            {label(c, 'LSH Banding (b = 8 bands, r = 4 rows)', 45, 232, 350, 20, 13, c.textPrimary)}
            {label(c, '• Band 0: Salts 0–3 → Differing hashes', 45, 256, 350, 18, 11, muted)}
            {label(
                c,
                '• Band 1: Salts 4–7 → Exact Match! (Collision in bucket)',
                45,
                276,
                350,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                '• Band 3: Salts 12–15 → Exact Match! (Collision in bucket)',
                45,
                296,
                350,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                'Collision flags pair (A, B) for exact verification',
                45,
                324,
                350,
                20,
                12,
                cyan,
            )}

            {label(
                c,
                'LSH S-curve: P(candidate) = 1 − (1 − s⁴)⁸ ≈ 67.5% at s = 0.60',
                35,
                400,
                370,
                22,
                11,
                muted,
                'center',
            )}
            {label(
                c,
                'Sub-quadratic indexing filters candidate pairs before pairwise checks',
                35,
                422,
                370,
                20,
                11,
                muted,
                'center',
            )}

            {/* Right Panel */}
            {label(
                c,
                '2. Verification & Connected Component Purge',
                455,
                62,
                370,
                24,
                16,
                c.textPrimary,
            )}
            {label(
                c,
                'Clustering candidate matches into deduplication graph',
                455,
                86,
                370,
                20,
                12,
                muted,
            )}

            {label(c, 'Document Deduplication Graph', 475, 118, 330, 20, 13, c.textPrimary)}
            {label(c, 'Doc A\nKEPT', 490, 162, 80, 36, 12, c.textPrimary, 'center')}
            {label(c, 'J = 0.60', 562, 160, 65, 18, 10, cyan, 'center')}
            {label(c, 'Doc B\nDROP', 620, 162, 80, 36, 12, c.textPrimary, 'center')}
            {label(c, 'Doc C\nKEPT', 730, 162, 70, 36, 12, c.textPrimary, 'center')}
            {label(
                c,
                'Component {A, B} has J ≥ 0.50. Component {C} is disjoint.',
                475,
                220,
                330,
                18,
                11,
                muted,
            )}

            {label(c, 'Deduplication Pipeline Decisions', 475, 308, 330, 20, 14, c.textPrimary)}
            {label(
                c,
                '• Candidate pair (A, B) verified: Jaccard 0.60 ≥ 0.50 (Match)',
                475,
                334,
                330,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                '• Cluster resolver selects Doc A as primary canonical record',
                475,
                356,
                330,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                '• Doc B removed: near-duplicate of Doc A (Pruned)',
                475,
                378,
                330,
                18,
                11,
                warm,
            )}
            {label(
                c,
                '• Doc C retained: zero collisions with A or B (Unique)',
                475,
                400,
                330,
                18,
                11,
                cyan,
            )}
            {label(
                c,
                'Result: 2 unique documents retained (67% yield), eliminating redundancy.',
                475,
                428,
                330,
                22,
                11,
                muted,
            )}

            {label(
                c,
                'MinHash LSH workflow · Fast candidate generation followed by exact Jaccard verification prevents quadratic cost',
                20,
                490,
                width - 40,
                24,
                14,
                muted,
                'center',
            )}
        </Board>
    )
}

export default create('dark')
