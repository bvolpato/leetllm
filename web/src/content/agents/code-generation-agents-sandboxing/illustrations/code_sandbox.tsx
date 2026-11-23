import React from 'react'
import {
    Card,
    Column,
    FlowArrow,
    Matrix,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 660
export const alt =
    'Artifact manifest binding diagram comparing candidate digest H(M) against a protected supervisor verdict record: matching base image, source files, environment, and grading test version pass verification while any tampered field triggers a digest mismatch and rejects promotion.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    const step = (title: string, detail: string, tone: 'blue' | 'purple' | 'green') =>
        Card({
            c,
            tone,
            width: 184,
            height: 112,
            padding: 8,
            gap: 4,
            justify: 'center',
            shadow: false,
            children: Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: title,
                        fontSize: 21,
                        fontWeight: 700,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: detail,
                        fontSize: 20,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        })
    return Scene({
        c,
        padding: 16,
        gap: 14,
        children: Column({
            gap: 16,
            width: 648,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Bind Grading Verdicts to Immutable Manifests',
                    fontSize: 23,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    width: 648,
                    gap: 8,
                    align: 'center',
                    justify: 'center',
                    children: [
                        step('Manifest M', 'base + code + tests', 'blue'),
                        FlowArrow({ c, direction: 'right', tone: 'blue', length: 24 }),
                        step('Digest H(M)', 'SHA-256 canonical JSON', 'purple'),
                        FlowArrow({ c, direction: 'right', tone: 'green', length: 24 }),
                        step('Trusted Ledger', 'verdict: pass for H(M)', 'green'),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Candidate Acceptance Checks Against Stored Ledger',
                    fontSize: 21,
                    fontWeight: 700,
                    color: c.textSecondary,
                }),
                Matrix({
                    c,
                    rowLabelWidth: 168,
                    cellWidth: 160,
                    cellHeight: 54,
                    fontSize: 20,
                    colorScale: 'strength',
                    colorDomain: [0, 2],
                    rowLabels: [
                        '1. Unchanged M',
                        '2. New base-v2',
                        '3. Edited parser.py',
                        '4. New tests-v2',
                    ],
                    colLabels: ['Modified Field', 'Digest Match', 'Decision'],
                    data: [
                        [2, 2, 2],
                        [0, 0, 0],
                        [0, 0, 0],
                        [0, 0, 0],
                    ],
                    labels: [
                        ['None', 'Match H(M)', 'Accept'],
                        ['base image', 'Mismatch', 'Reject'],
                        ['return []', 'Mismatch', 'Reject'],
                        ['test suite', 'Mismatch', 'Reject'],
                    ],
                }),
                Card({
                    c,
                    tone: 'warm',
                    width: 648,
                    padding: 10,
                    shadow: false,
                    children: TextLabel({
                        c,
                        text: 'Digest equality verifies bytes tested; deployment requires explicit approval.',
                        fontSize: 20,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
