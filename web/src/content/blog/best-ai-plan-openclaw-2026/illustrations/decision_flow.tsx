import React from 'react'
import { GraphDiagram, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'

export const width = 960
export const height = 500
export const alt =
    'Credential routing checks permitted workload scope first. Disallowed work stops early. Eligible work uses its primary credential. On failure, a backup runs only when its usage terms, data rules, and budget are approved; otherwise the task stops or waits.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 'compact')
    return Scene({
        c,
        padding: 28,
        gap: 14,
        contentWidth: 904,
        children: [
            TextLabel({
                c,
                text: 'Credential routing and failover decision path',
                width: 904,
                fontSize: 22,
                fontWeight: 700,
                color: c.textPrimary,
            }),
            GraphDiagram({
                c,
                width: 904,
                height: 320,
                direction: 'LR',
                routing: 'orthogonal',
                nodeWidth: 150,
                nodeHeight: 72,
                labelFontSize: 15,
                detailFontSize: 12,
                density: 'compact',
                legend: false,
                ariaLabel: alt,
                nodes: [
                    {
                        id: 'eligible',
                        label: 'Workload check',
                        detail: 'permitted scope?',
                        tone: 'purple',
                    },
                    {
                        id: 'reject',
                        label: 'Stop early',
                        detail: 'disallowed scope',
                        tone: 'critical',
                    },
                    {
                        id: 'primary',
                        label: 'Primary key',
                        detail: 'within task limits',
                        tone: 'blue',
                    },
                    {
                        id: 'backup_ok',
                        label: 'Backup approved?',
                        detail: 'terms + data + budget',
                        tone: 'warm',
                    },
                    {
                        id: 'backup',
                        label: 'Named backup',
                        detail: 'log key + spend',
                        tone: 'green',
                    },
                    {
                        id: 'halt',
                        label: 'Stop or wait',
                        detail: 'no silent overflow',
                        tone: 'critical',
                    },
                ],
                edges: [
                    { from: 'eligible', to: 'reject', label: 'no', tone: 'critical' },
                    { from: 'eligible', to: 'primary', label: 'yes', tone: 'blue' },
                    { from: 'primary', to: 'backup_ok', label: 'failure', tone: 'warm' },
                    { from: 'backup_ok', to: 'backup', label: 'yes', tone: 'green' },
                    { from: 'backup_ok', to: 'halt', label: 'no', tone: 'critical' },
                ],
            }),
            TextLabel({
                c,
                text: 'Configure these checks explicitly in OpenClaw.',
                width: 904,
                fontSize: 16,
                color: c.textSecondary,
                align: 'center',
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
