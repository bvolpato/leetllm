import React from 'react'
import { GraphDiagram, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'

export const width = 880
export const height = 450
export const alt =
    'Downloadable weights can be served by company-operated or external provider-operated inference. A closed-weight API is provider operated. The two external routes receive the assembled request regardless of checkpoint access.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 'compact')
    const contentWidth = width - 56

    return Scene({
        c,
        padding: 28,
        gap: 14,
        contentWidth,
        children: [
            TextLabel({
                c,
                text: 'Weight access and operator control are separate choices',
                width: contentWidth,
                fontSize: 22,
                fontWeight: 700,
                color: c.textPrimary,
            }),
            GraphDiagram({
                c,
                width: contentWidth,
                height: 310,
                direction: 'LR',
                routing: 'orthogonal',
                nodeWidth: 185,
                nodeHeight: 74,
                labelFontSize: 15,
                detailFontSize: 12,
                density: 'compact',
                legend: false,
                ariaLabel: alt,
                nodes: [
                    {
                        id: 'open_weights',
                        label: 'Downloadable weights',
                        detail: 'license defines rights',
                        tone: 'purple',
                    },
                    {
                        id: 'closed_api',
                        label: 'Closed-weight API',
                        detail: 'no weight download',
                        tone: 'blue',
                    },
                    {
                        id: 'company_op',
                        label: 'Company operator',
                        detail: 'company inference',
                        tone: 'green',
                    },
                    {
                        id: 'external_op',
                        label: 'External operator',
                        detail: 'provider receives request',
                        tone: 'warm',
                    },
                    {
                        id: 'internal_path',
                        label: 'Internal data path',
                        detail: 'private logs and tools',
                        tone: 'green',
                    },
                    {
                        id: 'external_path',
                        label: 'External data & terms',
                        detail: 'request, logs and tools',
                        tone: 'warm',
                    },
                ],
                edges: [
                    { from: 'open_weights', to: 'company_op', tone: 'green' },
                    { from: 'open_weights', to: 'external_op', tone: 'warm' },
                    { from: 'closed_api', to: 'external_op', tone: 'blue' },
                    { from: 'company_op', to: 'internal_path', tone: 'green' },
                    { from: 'external_op', to: 'external_path', tone: 'warm' },
                ],
            }),
            TextLabel({
                c,
                text: 'Both external paths send the assembled prompt, history, retrieved evidence, and tool outputs off-site.',
                width: contentWidth,
                fontSize: 13,
                fontWeight: 500,
                color: c.textSecondary,
                align: 'center',
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
