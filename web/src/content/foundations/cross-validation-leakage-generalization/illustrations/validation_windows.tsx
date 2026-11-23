import React from 'react'
import {
    Flow,
    Panel,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 640
export const height = 790
export const alt =
    'Walk-forward validation schedule across January through August with two queries per month. Fold 1 fits Jan-Feb and scores Mar-Apr; Fold 2 fits Jan-Apr and scores May-Jun; candidate selection fits Jan-Jun, tunes threshold in July, and tests once on August. A separate prompt r2 logged on June 20 receives its label on August 2 and stays excluded from the July 1 training fit.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={10} gap={8} contentWidth={576}>
            <Panel
                c={c}
                title="1. Expand training windows; lock future months"
                tone="blue"
                width={576}
                padding={8}
                gap={4}
            >
                <TextLabel
                    c={c}
                    text="CV Fold 1: fit Jan-Feb (4), score Mar-Apr (4)"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    segments={[
                        { label: 'Fit (4)', value: 25, color: 'primary' },
                        { label: 'Val (4)', value: 25, color: 'warning' },
                        { label: 'Future (8)', value: 50, color: 'neutral' },
                    ]}
                />
                <TextLabel
                    c={c}
                    text="CV Fold 2: fit Jan-Apr (8), score May-Jun (4)"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    segments={[
                        { label: 'Fit (8)', value: 50, color: 'primary' },
                        { label: 'Val (4)', value: 25, color: 'warning' },
                        { label: 'Future (4)', value: 25, color: 'neutral' },
                    ]}
                />
                <TextLabel
                    c={c}
                    text="Candidate: fit Jan-Jun (12), tune Jul (2), lock Aug"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    segments={[
                        { label: 'Fit (12)', value: 75, color: 'primary' },
                        { label: 'Jul', value: 12.5, color: 'violet' },
                        { label: 'Lock', value: 12.5, color: 'neutral' },
                    ]}
                />
                <TextLabel
                    c={c}
                    text="Final evaluation: frozen candidate tested once on Aug"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    showLegend
                    segments={[
                        { label: 'Frozen Jan-Jul (14)', value: 87.5, color: 'primary' },
                        { label: 'Aug', value: 12.5, color: 'positive' },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Prompt r2: early input, delayed Aug 2 label"
                tone="warm"
                width={576}
                padding={10}
                gap={8}
            >
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={6}
                    connectorLength={16}
                    connectorTone="warm"
                    stages={[
                        {
                            eyebrow: 'LOGGED',
                            title: 'Jun 20',
                            lines: ['Seen u2'],
                            tone: 'blue',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'FIT CUTOFF',
                            title: 'Jul 1',
                            lines: ['Skip label'],
                            tone: 'critical',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'LABEL READY',
                            title: 'Aug 2',
                            lines: ['Post fit'],
                            tone: 'purple',
                            width: 162,
                            padding: 10,
                        },
                    ]}
                />
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
