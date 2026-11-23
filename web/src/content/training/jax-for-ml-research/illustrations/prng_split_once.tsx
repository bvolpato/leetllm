import React from 'react'
import { BadgePill, Column, GraphDiagram, Panel, Row, Scene, defineIllustration } from 'vizmatic'

export const width = 760
export const height = 620
export const preset = 'engineering'
export const alt =
    'Seed-7 Threefry PRNG splitting derives independent keys. Calling split(root, 3) produces next, A, and B: reusing A replays identical normal draws, whereas B generates an independent normal stream. In a separate split(root, 2) check with one-bit Bernoulli p=0.5, distinct child keys both return False, matching the 0.5 independent agreement rate.'

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Split keys once at each consumer"
        subtitle="Seed 7 Threefry key trees vs accidental key reuse"
        padding={20}
        gap={14}
        contentWidth={720}
    >
        <Column gap={14} align="center">
            <GraphDiagram
                c={c}
                direction="TB"
                layout="auto"
                routing="orthogonal"
                nodeGap={36}
                rankGap={70}
                edgeGap={20}
                nodeWidth={210}
                nodeHeight={78}
                labelFontSize={24}
                detailFontSize={23}
                nodes={[
                    { id: 'root', label: 'root = key(7)', detail: 'Threefry parent', tone: 'blue' },
                    { id: 'next', label: 'next_key', detail: 'keep step t+1', tone: 'cyan' },
                    { id: 'ka', label: 'subkey A', detail: 'normal(A) · 1', tone: 'purple' },
                    { id: 'kb', label: 'subkey B', detail: 'normal(B) · new', tone: 'green' },
                    { id: 'reuse', label: 'reuse(A)', detail: 'replay == A', tone: 'critical' },
                ]}
                edges={[
                    { from: 'root', to: 'next', tone: 'cyan' },
                    { from: 'root', to: 'ka', tone: 'purple' },
                    { from: 'root', to: 'kb', tone: 'green' },
                    { from: 'ka', to: 'reuse', tone: 'critical', dashed: true },
                ]}
            />
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    title="Distinct children can still match on 1 bit"
                    tone="warm"
                    padding={14}
                    width={720}
                    titleFontSize={24}
                >
                    <Row gap={12} align="center" justify="space-between">
                        <BadgePill
                            c={c}
                            text="split(root, 2) → k₀, k₁"
                            tone="cyan"
                            filled={false}
                            fontSize={23}
                            height={42}
                            width={270}
                        />
                        <BadgePill
                            c={c}
                            text="bernoulli(0.5): [False] & [False]"
                            tone="warm"
                            filled={false}
                            fontSize={23}
                            height={42}
                            width={400}
                        />
                    </Row>
                </Panel>
            </Row>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
