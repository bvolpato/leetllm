import { Column, GraphDiagram, Scene, TextLabel, defineIllustration } from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const alt =
    'Predicate filter pipeline for Bob (agent:u3) searching key in workspace w01 as of 2026-08-12. Starting from four matching rows with Bob grants (c7-old, c7a, c7b, c99), the half-open time filter drops retired c7-old (ended Jul 1) and the workspace predicate drops c99 (in w02), returning only active chunks c7a and c7b.'

export const width = 680
export const height = 600
export const preset = 'engineering'

const illustration = defineIllustration((c) => {
    const diagram = preparePrintTypography(
        GraphDiagram({
            c,
            width: 608,
            height: 470,
            padding: 18,
            direction: 'TB',
            routing: 'orthogonal',
            arrowSize: 6,
            nodeWidth: 216,
            nodeHeight: 74,
            nodeGap: 24,
            rankGap: 48,
            labelFontSize: 20,
            detailFontSize: 20,
            nodes: [
                {
                    id: 'grants',
                    label: "1. Bob Grants + 'key'",
                    detail: 'c7-old, c7a, c7b, c99',
                    icon: 'database',
                    tone: 'blue',
                },
                {
                    id: 'expired',
                    label: 'Dropped: c7-old',
                    detail: 'valid_to Jul 1 <= Aug 12',
                    icon: 'warning',
                    tone: 'critical',
                },
                {
                    id: 'active',
                    label: '2. Active at 2026-08-12',
                    detail: 'c7a, c7b, c99 pass window',
                    icon: 'layers',
                    tone: 'purple',
                },
                {
                    id: 'other_ws',
                    label: 'Dropped: c99',
                    detail: 'workspace_id = w02 != w01',
                    icon: 'lock',
                    tone: 'warm',
                },
                {
                    id: 'allowed',
                    label: '3. Returned Context',
                    detail: 'c7a, c7b (d7 in w01)',
                    icon: 'check',
                    tone: 'green',
                },
            ],
            edges: [
                {
                    from: 'grants',
                    to: 'expired',
                    label: 'fails valid_to',
                    dashed: true,
                    tone: 'critical',
                },
                {
                    from: 'grants',
                    to: 'active',
                    label: 'passes [from, to)',
                    kind: 'data',
                    tone: 'purple',
                },
                {
                    from: 'active',
                    to: 'other_ws',
                    label: 'fails w01',
                    dashed: true,
                    tone: 'warm',
                },
                {
                    from: 'active',
                    to: 'allowed',
                    label: 'workspace = w01',
                    kind: 'data',
                    tone: 'green',
                },
            ],
        }),
        20,
    )

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: width - 32,
        align: 'center',
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Scoped Retrieval Filter Path (Bob · key · w01)',
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Time window and workspace checks eliminate stale and cross-tenant grants',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                diagram,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
