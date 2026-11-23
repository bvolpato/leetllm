import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 640
export const height = 560
export const alt =
    'Four-stage NLP classification flow from grouped temporal split through PhraseCNN training, temperature scaling at T*=1.62, and calibrated routing to urgent page, automated route, or human review.'

const illustration = defineIllustration((c) => (
    <Scene c={c} padding={16}>
        <GraphDiagram
            c={c}
            width={608}
            height={528}
            direction="TB"
            routing="orthogonal"
            labelFontSize={20}
            detailFontSize={19}
            arrowSize={7}
            rankGap={28}
            nodeGap={16}
            ariaLabel={alt}
            nodes={[
                {
                    id: 'split',
                    label: 'Grouped Time Split',
                    detail: '72 orgs | M1-M4',
                    tone: 'blue',
                },
                {
                    id: 'train',
                    label: 'PhraseCNN + AdamW',
                    detail: 'Val NLL 0.150 (Ep 20)',
                    tone: 'cyan',
                },
                {
                    id: 'cal',
                    label: 'Temp Scale T*=1.62',
                    detail: 'NLL 0.694 -> 0.502',
                    tone: 'purple',
                },
                {
                    id: 'page',
                    label: 'Urgent Page',
                    detail: 'F0.5 >= 0.749',
                    tone: 'critical',
                },
                {
                    id: 'auto',
                    label: 'Auto-Route',
                    detail: 'p >= 0.65 (90.6%)',
                    tone: 'green',
                },
                {
                    id: 'review',
                    label: 'Human Review',
                    detail: '11.5% uncertain',
                    tone: 'warm',
                },
            ]}
            edges={[
                { from: 'split', to: 'train', kind: 'data' },
                { from: 'train', to: 'cal', kind: 'data' },
                { from: 'cal', to: 'page', kind: 'event' },
                { from: 'cal', to: 'auto', kind: 'data' },
                { from: 'cal', to: 'review', style: 'dashed', kind: 'event' },
            ]}
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
