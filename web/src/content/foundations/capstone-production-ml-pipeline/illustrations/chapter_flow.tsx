import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 640
export const height = 560
export const alt =
    'Production ML pipeline lifecycle from point-in-time merge_asof feature joins through sklearn Pipeline serialization with SHA-256 verification, offline slice gates, healthy canary promotion, and automated KS/PSI rollback.'

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
                    id: 'pit',
                    label: 'Point-in-Time Join',
                    detail: 'available <= predict',
                    tone: 'blue',
                },
                {
                    id: 'bundle',
                    label: 'Sklearn Pipeline',
                    detail: 'AUC 0.823, SHA-256',
                    tone: 'cyan',
                },
                {
                    id: 'gate',
                    label: 'Offline Slice Gate',
                    detail: 'Express 0.808 >= 0.65',
                    tone: 'purple',
                },
                {
                    id: 'rollback',
                    label: 'Rollback to v1 (W3)',
                    detail: 'KS 0.997, PSI 7.37',
                    tone: 'critical',
                },
                {
                    id: 'promote',
                    label: 'Canary Promote (W1)',
                    detail: 'KS 0.080, PSI 0.092',
                    tone: 'green',
                },
            ]}
            edges={[
                { from: 'pit', to: 'bundle', kind: 'data' },
                { from: 'bundle', to: 'gate', kind: 'data' },
                {
                    from: 'gate',
                    to: 'rollback',
                    style: 'dashed',
                    kind: 'event',
                    fromSide: 'bottom',
                    toSide: 'top',
                },
                {
                    from: 'gate',
                    to: 'promote',
                    kind: 'data',
                    fromSide: 'bottom',
                    toSide: 'top',
                },
            ]}
        />
    </Scene>
))

export const create = illustration.create
export default illustration.default
