import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { GridCell, ThemeMode } from 'vizmatic'

export const width = 940
export const height = 760
export const alt =
    'Left panel traces Blelloch exclusive scan on [3, -1, 4, 1]: up-sweep reduces to 7, clearing the root to 0 seeds down-sweep outputs [0, 3, 2, 6], while Hillis-Steele computes [3, 2, 3, 5] then [3, 2, 6, 7]. Right panel charts addition counts: at N = 32 Hillis-Steele uses 129 vs 62 for Blelloch (2.08x), and at N = 512 it uses 4097 vs 1022 (4.01x).'

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const blellochRows: Array<Array<string | GridCell>> = [
    ['In', '3', '-1', '4', '1'],
    ['Up 1', '3', '2', '4', '5'],
    ['Up 2', '3', '2', '4', cell('7', 'blue')],
    ['Zero', '3', '2', '4', cell('0', 'warm')],
    ['Dn 2', '3', '0', '4', '2'],
    ['Dn 1', cell('0', 'green'), cell('3', 'green'), cell('2', 'green'), cell('6', 'green')],
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={10}
                    tone="purple"
                    titleFontSize={32}
                    title="Blelloch trace on [3, -1, 4, 1]"
                >
                    <TextLabel c={c} text="Up-sweep finds 7; zero root seeds scan" fontSize={28} />
                    <Grid
                        c={c}
                        rows={blellochRows}
                        cellWidth={78}
                        cellHeight={44}
                        gap={5}
                        fontSize={28}
                        headerCols={1}
                    />
                    <TextLabel c={c} text="Hillis-Steele inclusive stages:" fontSize={28} />
                    <BadgePill
                        c={c}
                        text="[3, 2, 3, 5] then [3, 2, 6, 7]"
                        tone="blue"
                        fontSize={28}
                    />
                    <TextLabel
                        c={c}
                        text="Bars compare add counts, not runtime"
                        fontSize={28}
                        align="center"
                    />
                </Panel>
                <Column width={447} gap={14}>
                    <Panel
                        c={c}
                        width={447}
                        padding={12}
                        gap={6}
                        tone="blue"
                        titleFontSize={30}
                        title="N = 32 additions (2.08x gap)"
                    >
                        <BarChart
                            c={c}
                            width={415}
                            height={235}
                            showGrid
                            showValues
                            data={[
                                { label: 'Hillis-Steele', value: 129, color: 'warning' },
                                { label: 'Blelloch', value: 62, color: 'positive' },
                            ]}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        width={447}
                        padding={12}
                        gap={6}
                        tone="warm"
                        titleFontSize={30}
                        title="N = 512 additions (4.01x gap)"
                    >
                        <BarChart
                            c={c}
                            width={415}
                            height={235}
                            showGrid
                            showValues
                            data={[
                                { label: 'Hillis-Steele', value: 4097, color: 'critical' },
                                { label: 'Blelloch', value: 1022, color: 'positive' },
                            ]}
                        />
                    </Panel>
                </Column>
            </Row>
        </Scene>
    )
}

export default create('dark')
