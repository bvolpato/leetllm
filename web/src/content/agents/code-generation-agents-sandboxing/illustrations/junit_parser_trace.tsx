import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 780
export const alt =
    'XML execution trace showing seven testcases parsed by direct child status: declined failure enters slot 1, offline error enters slot 2, both merges once into slot 3, skipped stops, repeated declined deduplicates, nested failure outside direct children is ignored, and api::skip precedence stops before error.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const stageCard = (title: string, detail: string, tone: 'red' | 'blue' | 'green') =>
        Panel({
            c,
            title,
            tone,
            width: 192,
            padding: 10,
            titleFontSize: 20,
            children: TextLabel({ c, text: detail, fontSize: 20, mono: true }),
        })

    const itemRow = (label: string, rule: string, tone: 'green' | 'warm') =>
        Row({
            gap: 8,
            justify: 'space-between',
            align: 'center',
            children: [
                TextLabel({ c, text: label, fontSize: 20, mono: true }),
                BadgePill({ c, text: rule, tone, fontSize: 20 }),
            ],
        })

    return Scene({
        c,
        title: 'JUnit Parser Trace: Direct-Child Tag Filter',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Row({
                gap: 8,
                align: 'stretch',
                children: [
                    stageCard('Buggy Patch', '@status attr', 'red'),
                    FlowArrow({ c, direction: 'right', tone: 'blue', length: 20 }),
                    stageCard('Repaired Scan', 'direct child tags', 'blue'),
                    FlowArrow({ c, direction: 'right', tone: 'green', length: 20 }),
                    stageCard('Unique List', '3 router:: IDs', 'green'),
                ],
            }),
            Column({
                gap: 12,
                align: 'stretch',
                children: [
                    Panel({
                        c,
                        title: 'Emitted Slots (Ordered Unique)',
                        tone: 'green',
                        width: 648,
                        padding: 12,
                        titleFontSize: 20,
                        children: Column({
                            gap: 8,
                            children: [
                                itemRow('<failure/> child tag', 'router::declined', 'green'),
                                itemRow('<error/> child tag', 'router::offline', 'green'),
                                itemRow('<failure/> + <error/>', 'router::both (1x)', 'green'),
                            ],
                        }),
                    }),
                    Panel({
                        c,
                        title: 'Filtered Cases (Omitted)',
                        tone: 'warm',
                        width: 648,
                        padding: 12,
                        titleFontSize: 20,
                        children: Column({
                            gap: 8,
                            children: [
                                itemRow('<skipped/> child tag', 'skip probe omitted', 'warm'),
                                itemRow('duplicate declined', 'seen set blocks repeat', 'warm'),
                                itemRow(
                                    '<details><failure/></details>',
                                    'nested non-direct ignored',
                                    'warm',
                                ),
                                itemRow('api::skip + <error/>', 'skip wins before error', 'warm'),
                            ],
                        }),
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
