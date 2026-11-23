import React from 'react'
import {
    Card,
    FlowArrow,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    renderToPngWithOutput,
    type ThemeMode,
} from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const forecast = 132
export const observed = 160
export const halfWidth = 3
export const error = observed - forecast
export const lower = forecast - halfWidth
export const upper = forecast + halfWidth
export const needsReview = Math.abs(error) > halfWidth

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return (
        <Scene c={c} background={c.bg} padding={48} gap={0}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 1104,
                    height: 534,
                    gap: 28,
                }}
            >
                <TextLabel
                    c={c}
                    text="Forecasting and Anomaly Detection"
                    variant="title"
                    fontSize={43}
                    color={c.textPrimary}
                />
                <TextLabel
                    c={c}
                    text="Synthetic batch-job example: forecast first, observe later, then investigate."
                    fontSize={24}
                />
                <Row gap={16} align="center">
                    <Card c={c} width={318} height={262} padding={24} gap={22} tone="blue">
                        <TextLabel
                            c={c}
                            text="Friday's count"
                            fontSize={29}
                            color={c.textPrimary}
                        />
                        <TextLabel c={c} text={`Forecast: ${forecast} jobs`} fontSize={25} />
                        <TextLabel c={c} text={`Observed: ${observed} jobs`} fontSize={25} />
                        <TextLabel
                            c={c}
                            text="Forecast issued before Friday's outcome"
                            fontSize={21}
                        />
                    </Card>
                    <FlowArrow c={c} direction="right" length={36} tone="purple" />
                    <Card c={c} width={318} height={262} padding={24} gap={22} tone="purple">
                        <TextLabel
                            c={c}
                            text="Forecast error"
                            fontSize={29}
                            color={c.textPrimary}
                        />
                        <TextLabel
                            c={c}
                            text={`${observed} − ${forecast} = +${error}`}
                            fontSize={31}
                            color={c.textPrimary}
                        />
                        <TextLabel c={c} text={`|error| > ${halfWidth} jobs`} fontSize={25} />
                        <TextLabel c={c} text={`Count band: [${lower}, ${upper}]`} fontSize={22} />
                    </Card>
                    <FlowArrow c={c} direction="right" length={36} tone="warm" />
                    <Card c={c} width={318} height={262} padding={24} gap={22} tone="warm">
                        <TextLabel
                            c={c}
                            text="Capacity review"
                            fontSize={29}
                            color={c.textPrimary}
                        />
                        <TextLabel
                            c={c}
                            text={needsReview ? 'Threshold crossed' : 'Within error band'}
                            fontSize={25}
                        />
                        <TextLabel c={c} text="Planned launch known" fontSize={23} />
                        <TextLabel c={c} text="Cause still open" fontSize={23} />
                    </Card>
                </Row>
                <TextLabel
                    c={c}
                    text="The ±3-job band summarizes earlier errors; test coverage on future jobs."
                    fontSize={23}
                />
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: 'auto',
                        fontSize: 23,
                        color: c.textMuted,
                    }}
                >
                    LeetLLM
                </div>
            </div>
        </Scene>
    )
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        theme,
        background: 'theme',
        scale: 1,
        crop: false,
        watermark: false,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height)
        throw new Error('Banner must be 1200 × 630')
    return result
}
export default create()
