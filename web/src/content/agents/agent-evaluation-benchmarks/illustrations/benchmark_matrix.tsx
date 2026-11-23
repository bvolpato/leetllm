import React from 'react'
import { Heatmap, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 470
export const alt =
    'Heatmap comparing six public agent benchmarks across isolation environment, final-state evaluation signal, reset cleanliness, and contamination guardrails: SWE-bench, WebArena, GAIA, OSWorld, TerminalBench, and Tau-Bench.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.05)

    return (
        <Scene
            c={c}
            density={2.05}
            padding={10}
            gap={6}
            title="Agent Benchmarks: Isolation, Oracle, and Reset Scope"
        >
            <Heatmap
                c={c}
                colorScale="strength"
                colorDomain={[1, 5]}
                cellWidth={124}
                cellHeight={54}
                rowLabelWidth={148}
                fontSize={21}
                xLabels={['Isolation', 'Oracle', 'Reset', 'Holdout']}
                yLabels={['SWE-bench', 'WebArena', 'GAIA', 'OSWorld', 'TerminalBench', 'Tau-Bench']}
                data={[
                    [4, 5, 5, 3],
                    [4, 4, 5, 3],
                    [3, 3, 4, 5],
                    [5, 5, 5, 4],
                    [5, 5, 5, 4],
                    [4, 5, 5, 5],
                ]}
                labels={[
                    ['Docker', 'Tests', 'Repo Snap', 'Verified'],
                    ['Browser', 'DOM+URL', 'App Snap', 'Private'],
                    ['Tool Pod', 'Answer', 'Stateless', 'Hidden'],
                    ['Full VM', 'OS State', 'VM Revert', 'Held Out'],
                    ['Docker', 'Exit+FS', 'Clean Img', 'Locked'],
                    ['DB Sim', 'DB Diff', 'Clean DB', 'Pass^k'],
                ]}
                ariaLabel="Heatmap of major agent evaluation benchmarks comparing isolation, oracle verifier, reset cleanliness, and leakage protection"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
