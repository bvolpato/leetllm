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
export const height = 650
export const alt =
    'Slot reuse and delayed cleanup lifecycle diagram showing worker-7 completing clean termination and baseline reset before worker-8 starts, and showing how resolving cleanup by immutable worker-7 leaves live worker-8 running whereas resolving by mutable slot A kills the wrong replacement.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const stage = (title: string, detail: string, tone: 'blue' | 'green' | 'warm') =>
        Panel({
            c,
            title,
            tone,
            width: 190,
            padding: 10,
            titleFontSize: 20,
            children: TextLabel({ c, text: detail, fontSize: 20 }),
        })

    return Scene({
        c,
        title: 'Safe Slot Reuse and Stale-Reaper Targeting',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Row({
                gap: 8,
                align: 'stretch',
                children: [
                    stage('1. worker-7 Exits', 'Confirmed kill', 'blue'),
                    FlowArrow({ c, direction: 'right', tone: 'blue', length: 20 }),
                    stage('2. Reset Slot A', 'Scrub disk & env', 'green'),
                    FlowArrow({ c, direction: 'right', tone: 'green', length: 20 }),
                    stage('3. worker-8 Runs', 'Reuses slot A', 'warm'),
                ],
            }),
            FlowArrow({ c, direction: 'down', tone: 'warm', length: 22 }),
            Panel({
                c,
                title: 'Delayed Gen-7 Cleanup Timer Fires While worker-8 Owns Slot A',
                tone: 'neutral',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: Row({
                    gap: 12,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Reap by Mutable Slot A',
                            tone: 'red',
                            width: 306,
                            padding: 10,
                            titleFontSize: 20,
                            children: Column({
                                gap: 8,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Target resolves to live worker-8',
                                        fontSize: 20,
                                    }),
                                    BadgePill({
                                        c,
                                        text: 'Wrong worker killed early',
                                        tone: 'red',
                                        fontSize: 20,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Reap by Immutable ID',
                            tone: 'green',
                            width: 306,
                            padding: 10,
                            titleFontSize: 20,
                            children: Column({
                                gap: 8,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'job_id=worker-7 no longer exists',
                                        fontSize: 20,
                                    }),
                                    BadgePill({
                                        c,
                                        text: 'Safe no-op · worker-8 kept',
                                        tone: 'green',
                                        fontSize: 20,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
