import React from 'react'
import {
    GraphDiagram,
    KeyValueList,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'
import manifest from './artifact_manifest.json'

export const width = 700
export const height = 740
export const alt =
    'Verification flow separating SHA-256 byte integrity checks (all five bundle prefixes match the manifest) from cryptographic producer authentication (signature absent in the unsigned local bundle).'

const expectedPrefixes = {
    code: 'ca609da6',
    runner: 'adde592e',
    config: 'bf9fad47',
    csv: '89c6ba89',
    results: 'df1957e2',
} as const

const currentPrefixes = {
    code: manifest.experiment_source_sha256.slice(0, 8),
    runner: manifest.exporter_sha256.slice(0, 8),
    config: manifest.config_sha256.slice(0, 8),
    csv: manifest.outputs['primary_seed_rows.csv'].slice(0, 8),
    results: manifest.outputs['study_results.json'].slice(0, 8),
}

for (const key of Object.keys(expectedPrefixes) as Array<keyof typeof expectedPrefixes>) {
    if (currentPrefixes[key] !== expectedPrefixes[key]) {
        throw new Error(`artifact_manifest.json prefix mismatch for ${key}`)
    }
}

const illustration = defineIllustration((base) => {
    const dc = withDensity(base, 2.05)
    return (
        <Scene
            c={dc}
            density={2.05}
            padding={8}
            gap={6}
            title="Checksums verify bytes, not authorship"
            subtitle="SHA-256 prefixes match manifest · unsigned bundle"
        >
            <GraphDiagram
                c={dc}
                width={656}
                height={240}
                padding={12}
                layout="auto"
                direction="LR"
                routing="dagre"
                nodeWidth={210}
                nodeHeight={72}
                labelFontSize={21}
                detailFontSize={20}
                nodes={[
                    {
                        id: 'files',
                        label: 'Artifact bytes',
                        detail: '5 hashed files',
                        tone: 'blue',
                    },
                    {
                        id: 'hash',
                        label: 'SHA-256 match',
                        detail: '5 / 5 verified',
                        tone: 'green',
                    },
                    {
                        id: 'sign',
                        label: 'Producer sign',
                        detail: 'absent · unverified',
                        tone: 'red',
                    },
                ]}
                edges={[
                    { from: 'files', to: 'hash' },
                    { from: 'files', to: 'sign', dashed: true },
                ]}
            />
            <Row gap={6}>
                <Panel c={dc} width={318} padding={8} title="SHA-256 prefixes" tone="green">
                    <KeyValueList
                        c={dc}
                        gap={4}
                        rows={[
                            {
                                key: 'Code',
                                value: currentPrefixes.code,
                                tone: 'green',
                                valueMono: true,
                            },
                            {
                                key: 'Runner',
                                value: currentPrefixes.runner,
                                tone: 'green',
                                valueMono: true,
                            },
                            {
                                key: 'Config',
                                value: currentPrefixes.config,
                                tone: 'green',
                                valueMono: true,
                            },
                            {
                                key: 'CSV',
                                value: currentPrefixes.csv,
                                tone: 'green',
                                valueMono: true,
                            },
                            {
                                key: 'JSON',
                                value: currentPrefixes.results,
                                tone: 'green',
                                valueMono: true,
                            },
                        ]}
                    />
                </Panel>
                <Panel c={dc} width={318} padding={8} title="Trust scope" tone="warm">
                    <KeyValueList
                        c={dc}
                        gap={4}
                        rows={[
                            { key: 'Bytes', value: '5 / 5 match', tone: 'green' },
                            { key: 'Env', value: `${manifest.os} Py3.12`, tone: 'blue' },
                            { key: 'Plan', value: 'Worked run', tone: 'warm' },
                            { key: 'Sig', value: 'Absent', tone: 'red' },
                            { key: 'Author', value: 'Unverified', tone: 'red' },
                        ]}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
