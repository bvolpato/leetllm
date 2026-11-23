import React from 'react'
import { Comparison, Scene, TextLabel, TiledMatrix, defineIllustration } from 'vizmatic'

export const width = 760
export const height = 640
export const opaqueBackground = false

export const alt =
    'Comparison between unshared N=8 parallel sampling and paged prefix sharing. Unshared branches store 8 duplicate 4,096-token prompt blocks plus 8 x 1,024 continuations (40,960 KV slots, 5.0 GiB), while prefix sharing stores 1 read-only prompt block plus 8 private tails (12,288 KV slots, 1.5 GiB, 70% savings).'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={12}>
        <Comparison
            c={c}
            gap={18}
            sideWidth={340}
            sides={[
                {
                    title: 'Unshared (N=8)',
                    subtitle: '40,960 slots (5.0 GiB)',
                    tone: 'critical',
                    children: (
                        <TiledMatrix
                            c={c}
                            rows={8}
                            cols={5}
                            cellSize={22}
                            gap={4}
                            regions={[
                                { rowStart: 0, rowEnd: 8, colStart: 0, colEnd: 4, tone: 'red' },
                                { rowStart: 0, rowEnd: 8, colStart: 4, colEnd: 5, tone: 'warm' },
                            ]}
                        />
                    ),
                    footer: (
                        <TextLabel
                            c={c}
                            text="8 copies + 8 tails"
                            fontSize={23}
                            color={c.textSecondary}
                        />
                    ),
                },
                {
                    title: 'Prefix-Shared',
                    subtitle: '12,288 slots (-70%)',
                    tone: 'green',
                    children: (
                        <TiledMatrix
                            c={c}
                            rows={9}
                            cols={5}
                            cellSize={20}
                            gap={4}
                            regions={[
                                { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 4, tone: 'green' },
                                { rowStart: 1, rowEnd: 9, colStart: 4, colEnd: 5, tone: 'blue' },
                            ]}
                        />
                    ),
                    footer: (
                        <TextLabel
                            c={c}
                            text="1 prompt + 8 tails (70% free)"
                            fontSize={23}
                            color={c.textSecondary}
                        />
                    ),
                },
            ]}
        />
    </Scene>
))

export const { create } = illustration
export default illustration.default
