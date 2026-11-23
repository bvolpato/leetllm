import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 580
export const alt =
    'A gateway authenticates session-b to tenant-beta and ignores its untrusted alpha claim. From the root hash trie, separate verified namespace salts give tenant-alpha and tenant-beta disjoint KV block keys even for identical system, guide, and tools text.'

const FONT = 26

interface TrieNodeSpec {
    x: number
    y: number
    w: number
    h: number
    title: string
    sub: string
    accent: string
    fill: string
}

function ScopeTrieDiagram({ c }: { c: ThemeColors }) {
    const nodes: TrieNodeSpec[] = [
        {
            x: 28,
            y: 112,
            w: 372,
            h: 82,
            title: 'session-b (claim: alpha)',
            sub: 'Untrusted claim ignored',
            accent: c.warningLight,
            fill: withColorAlpha(c.warning, 0.14),
        },
        {
            x: 440,
            y: 112,
            w: 372,
            h: 82,
            title: 'Auth -> salt: tenant-beta',
            sub: 'Unknown session fails early',
            accent: c.primaryLight,
            fill: withColorAlpha(c.primary, 0.14),
        },
        {
            x: 28,
            y: 318,
            w: 148,
            h: 84,
            title: 'Trie Root',
            sub: 'salt | id',
            accent: c.borderLight,
            fill: withColorAlpha(c.neutralLight, 0.24),
        },
        {
            x: 204,
            y: 224,
            w: 184,
            h: 84,
            title: 'alpha salt',
            sub: 'root 4e81a0',
            accent: c.violetLight,
            fill: withColorAlpha(c.violet, 0.14),
        },
        {
            x: 414,
            y: 224,
            w: 192,
            h: 84,
            title: 'sys + guide',
            sub: 'key 9a20b4',
            accent: c.borderLight,
            fill: withColorAlpha(c.neutralLight, 0.22),
        },
        {
            x: 632,
            y: 224,
            w: 180,
            h: 84,
            title: 'alpha tools',
            sub: 'c11d72 miss',
            accent: c.criticalLight,
            fill: withColorAlpha(c.critical, 0.14),
        },
        {
            x: 204,
            y: 412,
            w: 184,
            h: 84,
            title: 'beta salt',
            sub: 'root 7c19e2',
            accent: c.positiveLight,
            fill: withColorAlpha(c.positive, 0.14),
        },
        {
            x: 414,
            y: 412,
            w: 192,
            h: 84,
            title: 'sys + guide',
            sub: 'key f304a8',
            accent: c.positiveLight,
            fill: withColorAlpha(c.positive, 0.14),
        },
        {
            x: 632,
            y: 412,
            w: 180,
            h: 84,
            title: 'beta tools',
            sub: '8b52c9 hit',
            accent: c.positiveLight,
            fill: withColorAlpha(c.positive, 0.2),
        },
    ]

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={28} y={18} width={784} height={40}>
                <TextLabel
                    c={c}
                    text="Namespace-salted KV trie isolates keys"
                    fontSize={29}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={28} y={60} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="Gateway sets salt from auth; identical tokens diverge"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {nodes.map((node) => (
                        <g key={`${node.x}-${node.y}`}>
                            <SvgFrame
                                c={c}
                                x={node.x}
                                y={node.y}
                                width={node.w}
                                height={node.h}
                                rx={10}
                                fill={node.fill}
                                stroke={node.accent}
                                strokeWidth={2}
                            />
                        </g>
                    ))}
                    <VectorArrow
                        x1={402}
                        y1={153}
                        x2={436}
                        y2={153}
                        color={c.primaryLight}
                        strokeWidth={2.5}
                    />
                    <VectorArrow
                        x1={178}
                        y1={342}
                        x2={200}
                        y2={276}
                        color={c.violetLight}
                        strokeWidth={2.5}
                    />
                    <VectorArrow
                        x1={178}
                        y1={374}
                        x2={200}
                        y2={444}
                        color={c.positiveLight}
                        strokeWidth={2.5}
                    />
                    <VectorArrow
                        x1={390}
                        y1={266}
                        x2={410}
                        y2={266}
                        color={c.borderLight}
                        strokeWidth={2.5}
                    />
                    <VectorArrow
                        x1={608}
                        y1={266}
                        x2={628}
                        y2={266}
                        color={c.criticalLight}
                        strokeWidth={2.5}
                    />
                    <VectorArrow
                        x1={390}
                        y1={454}
                        x2={410}
                        y2={454}
                        color={c.positiveLight}
                        strokeWidth={2.5}
                    />
                    <VectorArrow
                        x1={608}
                        y1={454}
                        x2={628}
                        y2={454}
                        color={c.positiveLight}
                        strokeWidth={2.5}
                    />
                </svg>
            </CanvasItem>
            {nodes.map((node) => (
                <React.Fragment key={`${node.x}-${node.y}-txt`}>
                    <CanvasItem x={node.x + 12} y={node.y + 10} width={node.w - 24} height={34}>
                        <TextLabel c={c} text={node.title} fontSize={FONT} fontWeight={700} />
                    </CanvasItem>
                    <CanvasItem x={node.x + 12} y={node.y + 44} width={node.w - 24} height={34}>
                        <TextLabel c={c} text={node.sub} fontSize={FONT} color={c.textMuted} />
                    </CanvasItem>
                </React.Fragment>
            ))}
            <CanvasItem x={28} y={522} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="Verified beta salt probes 7c19e2 -> f304a8 -> 8b52c9 only."
                    fontSize={FONT}
                    color={c.positiveLight}
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c) => <ScopeTrieDiagram c={c} />)

export const create = illustration.create
export default illustration.default
