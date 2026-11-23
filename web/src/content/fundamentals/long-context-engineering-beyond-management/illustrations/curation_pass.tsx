import React from 'react'
import {
    FlowArrow,
    KeyValueList,
    Panel,
    Row,
    Scene,
    StackedBar,
    defineIllustration,
} from 'vizmatic'

export const width = 720
export const height = 780
export const autoSize = true

export const alt =
    'Token breakdown comparing the 12,436-token raw PR-418 window against the curated 3,346-token next call after keeping 3,160 active tokens, reloading 186 tokens of notes, and dropping 9,090 net noise tokens.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={1.9} padding={14} gap={10}>
        <StackedBar
            c={c}
            width={684}
            height={36}
            title="Before curation (12,436 tokens)"
            showLegend={true}
            ariaLabel="Token breakdown before curation totaling 12,436 tokens"
            segments={[
                { label: 'Active kept', value: 3160, valueLabel: '3,160', color: c.info },
                { label: 'Old pytest dump', value: 8200, valueLabel: '8,200', color: c.critical },
                { label: 'Unused tools', value: 770, valueLabel: '770', color: c.warning },
                { label: 'Noise + trace', value: 306, valueLabel: '306', color: c.neutralLight },
            ]}
        />

        <StackedBar
            c={c}
            width={684}
            height={36}
            title="After curation (3,346 tokens)"
            showLegend={true}
            ariaLabel="Token breakdown after curation totaling 3,346 tokens"
            segments={[
                { label: 'Active kept', value: 3160, valueLabel: '3,160', color: c.info },
                { label: 'Reloaded notes', value: 186, valueLabel: '186', color: c.positive },
                { label: 'Omitted', value: 9090, valueLabel: '9,090', color: c.neutralLight },
            ]}
        />

        <Row gap={10} width="100%" align="stretch">
            <Panel c={c} tone="green" width="46%" padding={10} gap={4} title="Next call (3,346)">
                <KeyValueList
                    c={c}
                    fontSize={22}
                    gap={5}
                    rows={[
                        { key: 'PR + trace + spec', value: '2,400', tone: 'cyan' },
                        { key: 'Scratchpad + tools', value: '760', tone: 'cyan' },
                        { key: 'kv_mask_shape', value: '+90', tone: 'green' },
                        { key: 'bpe_ruled_out', value: '+96', tone: 'green' },
                    ]}
                />
            </Panel>

            <FlowArrow c={c} direction="right" tone="neutral" length={18} />

            <Panel c={c} tone="red" width="46%" padding={10} gap={4} title="Omitted (-9,090 net)">
                <KeyValueList
                    c={c}
                    fontSize={22}
                    gap={5}
                    rows={[
                        { key: 'old_pytest_dump', value: '-8,200', tone: 'red' },
                        { key: 'dataset_shuffler', value: '-360', tone: 'warm' },
                        { key: 'vocab_rebuild', value: '-410', tone: 'warm' },
                        { key: 'disproven_bpe', value: '-120', tone: 'neutral' },
                    ]}
                />
            </Panel>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
