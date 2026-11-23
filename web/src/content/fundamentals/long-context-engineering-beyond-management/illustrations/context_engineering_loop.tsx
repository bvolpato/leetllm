import React from 'react'
import {
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 740
export const height = 820
export const autoSize = true

export const alt =
    'Diagram of how four context engineering operations reorganize a crowded 12,436-token PR-418 debugging window with mid-context test_log_17 and diff_summary findings into a focused 3,346-token call.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.0} padding={14} gap={10}>
        <Panel
            c={c}
            tone="warm"
            width="100%"
            padding={12}
            gap={6}
            title="Raw window: 12,436 tokens bury middle clues"
        >
            <StackedBar
                c={c}
                width={676}
                height={44}
                showLegend={true}
                ariaLabel="Raw context window layout before curation"
                segments={[
                    { label: 'PR + test_log_17', value: 20, valueLabel: '20%', color: c.info },
                    { label: 'Old pytest dump', value: 40, valueLabel: '40%', color: c.critical },
                    { label: 'diff_summary (mid)', value: 15, valueLabel: '15%', color: c.warning },
                    {
                        label: 'Unused + BPE noise',
                        value: 25,
                        valueLabel: '25%',
                        color: c.neutralLight,
                    },
                ]}
            />
            <TextLabel
                c={c}
                fontSize={22}
                color={c.textSecondary}
                text="Link kv_cache.py:84 and attention.py:112 without mid-window interference"
            />
        </Panel>

        <FlowArrow c={c} direction="down" tone="cyan" length={22} label="Four curation moves" />

        <Column gap={10} width="100%">
            <Row gap={10} width="100%" align="stretch">
                <Panel c={c} tone="cyan" width="49%" padding={10} gap={4} title="1. Select">
                    <TextLabel
                        c={c}
                        fontSize={22}
                        text="Keep PR-418 trace, spec, and diff/symbol tools"
                    />
                </Panel>
                <Panel
                    c={c}
                    tone="green"
                    width="49%"
                    padding={10}
                    gap={4}
                    title="2. Write + Reload"
                >
                    <TextLabel
                        c={c}
                        fontSize={22}
                        text="Save mask and BPE findings outside; reload brief notes"
                    />
                </Panel>
            </Row>

            <Row gap={10} width="100%" align="stretch">
                <Panel c={c} tone="purple" width="49%" padding={10} gap={4} title="3. Compress">
                    <TextLabel
                        c={c}
                        fontSize={22}
                        text="Replace 8,200 pytest tokens with verified shapes"
                    />
                </Panel>
                <Panel c={c} tone="warm" width="49%" padding={10} gap={4} title="4. Isolate">
                    <TextLabel
                        c={c}
                        fontSize={22}
                        text="Inspect tokenizer traces in a subagent with clean budget"
                    />
                </Panel>
            </Row>
        </Column>

        <FlowArrow c={c} direction="down" tone="green" length={22} label="Feed next call" />

        <Panel
            c={c}
            tone="green"
            width="100%"
            padding={12}
            gap={2}
            title="Next call: 3,346 tokens (-73.1%)"
            subtitle="3,160 active inputs + 186 reloaded notes -> direct mask fix"
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
