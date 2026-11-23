import React from 'react'
import { FlowArrow, KeyValueList, Panel, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const width = 740
export const height = 820
export const autoSize = true

export const alt =
    'Document ingestion pipeline branching from digital PDF, HTML, and Markdown sources alongside scanned OCR pages through layout-aware extraction and validation into an indexed store for verified 15-second prefill rules or a review queue for uncertain 1S OCR text, garbled bytes, or interleaved columns.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.05} padding={12} gap={8}>
        <Row gap={10} width="100%" align="stretch">
            <Panel c={c} tone="cyan" width="49%" padding={10} gap={4} title="Born-digital sources">
                <TextLabel c={c} fontSize={23} text="PDF text (inference-spec-v3)" />
                <TextLabel c={c} fontSize={23} text="HTML (<main>, headings)" />
                <TextLabel c={c} fontSize={23} text="Markdown headings + fences" />
            </Panel>
            <Panel c={c} tone="warm" width="49%" padding={10} gap={4} title="Scanned sources">
                <TextLabel c={c} fontSize={23} text="Page images via OCR" />
                <TextLabel c={c} fontSize={23} text="Multi-column bleed risk" />
                <TextLabel c={c} fontSize={23} text="Split tags + broken bytes" />
            </Panel>
        </Row>

        <FlowArrow
            c={c}
            direction="down"
            tone="cyan"
            length={16}
            label="Normalize + keep page links"
        />

        <Panel
            c={c}
            tone="blue"
            width="100%"
            padding={10}
            gap={2}
            title="Structure parser + validation checks"
        >
            <TextLabel
                c={c}
                fontSize={23}
                text="Keep headings, digits (15 stays 15), code fences, page numbers, and SHA-256 digests"
            />
        </Panel>

        <FlowArrow
            c={c}
            direction="down"
            tone="green"
            length={16}
            label="Gate by verification status"
        />

        <Row gap={10} width="100%" align="stretch">
            <Panel c={c} tone="green" width="49%" padding={10} gap={4} title="Verified -> Index">
                <KeyValueList
                    c={c}
                    fontSize={23}
                    gap={4}
                    rows={[
                        { key: 'Prefill rule', value: '15 seconds', tone: 'green' },
                        { key: 'Source ref', value: 'spec v3 p.7', tone: 'cyan' },
                        { key: 'Digest', value: 'sha256 OK', tone: 'cyan' },
                    ]}
                />
            </Panel>

            <Panel c={c} tone="red" width="49%" padding={10} gap={4} title="Flagged -> Hold">
                <KeyValueList
                    c={c}
                    fontSize={23}
                    gap={4}
                    rows={[
                        { key: 'OCR drift', value: '1S seconds', tone: 'warm' },
                        { key: 'Decode fail', value: 'U+FFFD hold', tone: 'red' },
                        { key: 'Columns', value: 'order review', tone: 'warm' },
                    ]}
                />
            </Panel>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
