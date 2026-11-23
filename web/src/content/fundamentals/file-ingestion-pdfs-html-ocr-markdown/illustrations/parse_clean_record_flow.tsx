import React from 'react'
import { FlowArrow, KeyValueList, Panel, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const width = 740
export const height = 820
export const autoSize = true

export const alt =
    'Comparison showing how inference-spec-v3 branches at verification: clean page 7 text yields an indexed 15-second prefill stall record, while scanned page 8 with ambiguous 1S OCR text stays in review instead of being silently rewritten.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.05} padding={12} gap={8}>
        <Panel
            c={c}
            tone="blue"
            width="100%"
            padding={10}
            gap={2}
            title="Source: inference-spec-v3.pdf"
        >
            <TextLabel
                c={c}
                fontSize={23}
                text="Prefill stall rule: abort stalled batch after 15 seconds with batch ID."
            />
        </Panel>

        <FlowArrow c={c} direction="down" tone="cyan" length={16} label="Inspect extracted text" />

        <Row gap={10} width="100%" align="stretch">
            <Panel c={c} tone="green" width="49%" padding={10} gap={4} title="Clean parse (p.7)">
                <KeyValueList
                    c={c}
                    fontSize={23}
                    gap={4}
                    rows={[
                        { key: 'Span', value: '15 seconds', tone: 'green' },
                        { key: 'Field', value: 'batch ID', tone: 'cyan' },
                        { key: 'Digest', value: 'verified', tone: 'green' },
                        { key: 'Target', value: 'indexed store', tone: 'green' },
                    ]}
                />
            </Panel>

            <Panel c={c} tone="warm" width="49%" padding={10} gap={4} title="Suspect OCR (p.8)">
                <KeyValueList
                    c={c}
                    fontSize={23}
                    gap={4}
                    rows={[
                        { key: 'Span', value: '1S seconds', tone: 'warm' },
                        { key: 'Auto-fix', value: 'blocked', tone: 'red' },
                        { key: 'Artifact', value: 'page 8 crop', tone: 'cyan' },
                        { key: 'Target', value: 'source review', tone: 'warm' },
                    ]}
                />
            </Panel>
        </Row>

        <FlowArrow
            c={c}
            direction="down"
            tone="neutral"
            length={16}
            label="Retrieval index policy"
        />

        <Panel
            c={c}
            tone="cyan"
            width="100%"
            padding={10}
            gap={2}
            title="Only verified records enter retrieval"
        >
            <TextLabel
                c={c}
                fontSize={23}
                text="Uncertain characters stay queued for pixel review rather than silent rewriting."
            />
        </Panel>
    </Scene>
))

export const create = illustration.create
export default illustration.default
