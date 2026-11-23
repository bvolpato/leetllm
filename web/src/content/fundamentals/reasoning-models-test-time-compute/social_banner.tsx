import React from 'react'
import { Column, LineChart, Row, Scene, TextLabel, defineIllustration, getReadableColor, renderToPng, withDensity } from 'vizmatic'

export const width = 1200
export const height = 630
export const opaqueBackground = true

const banner = defineIllustration((rawC) => {
    const c = withDensity(rawC, 2.2)
    return (
        <Scene c={c} padding={48} gap={28} background="#111319">
            <Column gap={10}>
                <TextLabel
                    c={c}
                    text="Reasoning & Test-Time Compute"
                    fontSize={52}
                    fontWeight={800}
                    color="#f4f4f6"
                />
                <TextLabel
                    c={c}
                    text="Trade inference tokens for accuracy with search, PRMs, and prefix-shared KV."
                    fontSize={26}
                    color="#9ea4b3"
                />
            </Column>
            <Row gap={36} align="center">
                <LineChart
                    c={c}
                    width={620}
                    height={310}
                    labels={['1x', '4x', '16x', '64x']}
                    min={0.3}
                    max={0.9}
                    format="percent"
                    directLabels
                    series={[
                        { name: 'PRM Search', points: [0.38, 0.56, 0.72, 0.81], color: getReadableColor('positive', c) },
                        { name: 'Best-of-N', points: [0.38, 0.49, 0.58, 0.63], color: getReadableColor('primary', c) },
                    ]}
                />
                <Column gap={14} width={410}>
                    <TextLabel c={c} text="Best-of-N & Majority Vote" fontSize={25} fontWeight={700} color="#6cc4ff" />
                    <TextLabel c={c} text="Process Reward Tree Search" fontSize={25} fontWeight={700} color="#7fe07f" />
                    <TextLabel c={c} text="Prefix-Shared KV Caching" fontSize={25} fontWeight={700} color="#f5b84d" />
                    <TextLabel c={c} text="LeetLLM" fontSize={24} fontWeight={700} color="#8b5cf6" />
                </Column>
            </Row>
        </Scene>
    )
}, 'dark')

export const { create } = banner
export default banner.default

if (typeof require !== 'undefined' && require.main === module) {
    const outPath = `${__dirname}/social_banner.png`
    renderToPng(banner.create('dark'), {
        width,
        height,
        outputPath: outPath,
        background: '#111319',
    }).then(() => console.log('Rendered', outPath))
}
