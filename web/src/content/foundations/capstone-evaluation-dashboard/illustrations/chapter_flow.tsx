import React from 'react'
import { Comparison, GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 700
export const height = 760
export const alt =
    'Architecture flow from frozen 120-item multi-slice evaluation through paired bootstrap, McNemar, and ECE checks into an isolated full-suite release gate, contrasting held rag-rerank-v2 at 75.0% against approved rag-rerank-v3 at 86.7%.'

const illustration = defineIllustration((base) => {
    const dc = withDensity(base, 2.0)

    return (
        <Scene c={base} padding={16} gap={12}>
            <GraphDiagram
                c={base}
                width={660}
                height={410}
                padding={10}
                layout="auto"
                direction="TB"
                routing="dagre"
                nodeWidth={168}
                nodeHeight={72}
                labelFontSize={22}
                detailFontSize={21}
                nodes={[
                    {
                        id: 'suite',
                        label: 'Eval Suite',
                        detail: 'N=120 · 4 slices',
                        tone: 'blue',
                    },
                    {
                        id: 'stats',
                        label: 'Slice Stats',
                        detail: 'CI & McNemar',
                        tone: 'cyan',
                    },
                    {
                        id: 'cal',
                        label: 'Calibration',
                        detail: 'Brier & ECE',
                        tone: 'purple',
                    },
                    {
                        id: 'gate',
                        label: 'Release Gate',
                        detail: 'Safety >= 0.90',
                        tone: 'warm',
                    },
                    {
                        id: 'view',
                        label: 'UI Filters',
                        detail: 'View only',
                        tone: 'green',
                    },
                ]}
                edges={[
                    { from: 'suite', to: 'stats' },
                    { from: 'suite', to: 'cal' },
                    { from: 'stats', to: 'gate' },
                    { from: 'cal', to: 'gate' },
                    { from: 'gate', to: 'view', dashed: true },
                ]}
            />
            <Comparison
                c={dc}
                gap={10}
                sides={[
                    {
                        title: 'v2: Hold (75%)',
                        tone: 'red',
                        lines: ['Safety 0.68 · ECE 0.08'],
                    },
                    {
                        title: 'v3: Ship (87%)',
                        tone: 'green',
                        lines: ['Safety 0.96 · ECE 0.02'],
                    },
                ]}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
