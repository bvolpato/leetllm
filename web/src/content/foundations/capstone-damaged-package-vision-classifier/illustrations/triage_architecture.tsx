import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 780
export const autoSize = false
export const alt =
    'Parcel routing checks whether any view is usable, takes the maximum calibrated frame score, applies the validation-selected threshold, and joins available inspection outcomes.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    return Scene({
        c,
        padding: 8,
        gap: 4,
        contentWidth: 660,
        children: GraphDiagram({
            c,
            width: 660,
            height: 740,
            direction: 'TB',
            routing: 'orthogonal',
            nodeWidth: 210,
            nodeHeight: 68,
            rankGap: 24,
            nodeGap: 20,
            labelFontSize: 22,
            detailFontSize: 20,
            nodes: [
                {
                    id: 'quality',
                    label: 'Usable Views?',
                    detail: 'Check every frame',
                    tone: 'warm',
                },
                {
                    id: 'recapture',
                    label: 'Recapture',
                    detail: 'All views unusable',
                    tone: 'red',
                },
                {
                    id: 'cnn',
                    label: 'CNN + Platt + Max',
                    detail: 'Usable-view scores',
                    tone: 'blue',
                },
                {
                    id: 'priority',
                    label: 'Priority Queue',
                    detail: 'Validation-selected tau',
                    tone: 'green',
                },
                {
                    id: 'standard',
                    label: 'Standard Flow',
                    detail: 'Routine (< tau)',
                    tone: 'neutral',
                },
                {
                    id: 'join',
                    label: 'Mature Join',
                    detail: 'Available by cutoff',
                    tone: 'cyan',
                },
            ],
            edges: [
                {
                    from: 'quality',
                    to: 'recapture',
                    label: 'none',
                    kind: 'event',
                    tone: 'red',
                },
                {
                    from: 'quality',
                    to: 'cnn',
                    label: 'yes',
                    kind: 'sync',
                    tone: 'green',
                },
                {
                    from: 'cnn',
                    to: 'priority',
                    label: '>= tau',
                    kind: 'sync',
                    tone: 'green',
                },
                {
                    from: 'cnn',
                    to: 'standard',
                    label: '< tau',
                    kind: 'data',
                    style: 'dashed',
                },
                { from: 'priority', to: 'join', kind: 'async' },
                {
                    from: 'standard',
                    to: 'join',
                    kind: 'async',
                    style: 'dashed',
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
