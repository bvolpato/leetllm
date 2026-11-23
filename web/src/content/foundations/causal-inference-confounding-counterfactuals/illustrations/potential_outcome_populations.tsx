import React from 'react'
import { DataTable, Panel, Scene, StackedBar, defineIllustration, withDensity } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'Potential outcomes and hidden response pairings. Top table shows Query 101 under RAG (Y(1)=1 observed, Y(0)=? missing) and Query 102 under Base (Y(1)=? missing, Y(0)=0 observed). Bottom panels compare Population A (68 always pass, 10 helped, 0 harmed, 22 never pass) and Population B (58 always pass, 20 helped, 10 harmed, 12 never pass): both produce 78% RAG vs 68% Base and ATE +10 pp, yet Population B harms 10 queries per 100.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Realized arm hides counterfactual"
                tone="blue"
                width={576}
                padding={10}
                gap={6}
            >
                <DataTable
                    c={c}
                    width={552}
                    headerRows={1}
                    headerCols={1}
                    align={['left', 'center', 'center', 'center']}
                    rows={[
                        ['Query', 'Arm', 'Y(1) RAG', 'Y(0) Base'],
                        ['#101', 'RAG', '1 (seen)', '? (missing)'],
                        ['#102', 'Base', '? (missing)', '0 (seen)'],
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Same 78% vs 68% (+10 pp ATE), different harm"
                tone="green"
                width={576}
                padding={10}
                gap={8}
            >
                <StackedBar
                    c={c}
                    width={552}
                    height={22}
                    title="Population A · 0 harmed / 100"
                    segments={[
                        { label: 'Always', value: 68, color: 'secondary', valueLabel: '68' },
                        { label: 'Helped', value: 10, color: 'positive', valueLabel: '10' },
                        { label: 'Never', value: 22, color: 'purple', valueLabel: '22' },
                    ]}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={22}
                    title="Population B · 10 harmed / 100"
                    segments={[
                        { label: 'Always', value: 58, color: 'secondary', valueLabel: '58' },
                        { label: 'Helped', value: 20, color: 'positive', valueLabel: '20' },
                        { label: 'Harmed', value: 10, color: 'critical', valueLabel: '10' },
                        { label: 'Never', value: 12, color: 'purple', valueLabel: '12' },
                    ]}
                />
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
