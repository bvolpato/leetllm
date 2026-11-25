import React from 'react'
import {
    BadgePill,
    BarChart,
    Card,
    Column,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
} from 'vizmatic'

export const width = 900
export const height = 435
export const alt =
    'Scaled 0 to 6 second Gantt timeline comparing serial agent execution against parallel DAG fan-out. Serial execution runs diff_agent (0 to 2s), test_agent (2 to 5s), and scan_agent (5 to 6s) for 6.0s wall time. Parallel DAG fan-out runs all three starting at 0s, finishing at the 3.0s test_agent critical path (2.0x speedup). A companion bar chart shows wall time halving from 6.0s to 3.0s while aggregate worker compute stays 6.0s.'

const illustration = defineIllustration((c) => {
    const cDiff = getToneColor('blue', c)
    const cTest = getToneColor('purple', c)
    const cScan = getToneColor('cyan', c)
    const cGreen = getToneColor('green', c)
    const cWarm = getToneColor('warm', c)

    const labelW = 92
    const secW = 72
    const trackW = secW * 6

    const ganttRow = (
        name: string,
        startSec: number,
        durSec: number,
        fill: string,
        barText: string,
    ) => (
        <Row gap={10} align="center" width={labelW + 10 + trackW}>
            <TextLabel c={c} text={name} fontSize={12} fontWeight={600} width={labelW} mono />
            <div
                style={{
                    display: 'flex',
                    width: trackW,
                    height: 26,
                    borderRadius: 6,
                    backgroundColor: c.bgSubtle,
                    border: `1px solid ${c.border}`,
                    overflow: 'hidden',
                }}
            >
                {startSec > 0 ? <div style={{ width: startSec * secW, height: 26 }} /> : null}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: durSec * secW,
                        height: 26,
                        backgroundColor: fill,
                        borderRadius: 4,
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                    }}
                >
                    {barText}
                </div>
            </div>
        </Row>
    )

    return (
        <Scene
            c={c}
            title="Serial Pipeline vs. Parallel DAG Critical Path (0s to 6s)"
            padding={16}
            gap={12}
            contentWidth={868}
        >
            <Row gap={16} align="stretch">
                <Card
                    c={c}
                    width={568}
                    padding={16}
                    gap={12}
                    title="Scaled Execution Timeline (0s to 6s)"
                    subtitle="Shared wall-clock axis across independent checks"
                >
                    <Column gap={8}>
                        <Row justify="space-between" align="center" width={labelW + 10 + trackW}>
                            <TextLabel
                                c={c}
                                text="Serial Chain (2s + 3s + 1s)"
                                fontSize={13}
                                fontWeight={700}
                                color={getReadableToneColor('warm', c)}
                            />
                            <BadgePill c={c} text="6.0s wall" tone="warm" filled fontSize={11} />
                        </Row>
                        {ganttRow('diff_agent', 0, 2, cDiff, '2.0s')}
                        {ganttRow('test_agent', 2, 3, cTest, '3.0s')}
                        {ganttRow('scan_agent', 5, 1, cScan, '1s')}
                    </Column>

                    <div
                        style={{
                            width: labelW + 10 + trackW,
                            height: 1,
                            backgroundColor: c.border,
                            marginTop: 4,
                            marginBottom: 4,
                        }}
                    />

                    <Column gap={8}>
                        <Row justify="space-between" align="center" width={labelW + 10 + trackW}>
                            <TextLabel
                                c={c}
                                text="Parallel DAG Fan-Out (max branch)"
                                fontSize={13}
                                fontWeight={700}
                                color={getReadableToneColor('green', c)}
                            />
                            <BadgePill c={c} text="3.0s (2.0x faster)" tone="green" filled fontSize={11} />
                        </Row>
                        {ganttRow('diff_agent', 0, 2, cDiff, '2.0s')}
                        {ganttRow('test_agent', 0, 3, cTest, '3.0s critical path')}
                        {ganttRow('scan_agent', 0, 1, cScan, '1s')}
                    </Column>

                    <Row gap={10} align="center" width={labelW + 10 + trackW}>
                        <TextLabel c={c} text="Wall time" fontSize={11} color={c.textMuted} width={labelW} />
                        <Row justify="space-between" width={trackW}>
                            {['0s', '1s', '2s', '3s', '4s', '5s', '6s'].map((tick) => (
                                <TextLabel
                                    key={tick}
                                    c={c}
                                    text={tick}
                                    fontSize={11}
                                    fontWeight={tick === '3s' || tick === '6s' ? 700 : 400}
                                    color={
                                        tick === '3s'
                                            ? getReadableToneColor('green', c)
                                            : tick === '6s'
                                              ? getReadableToneColor('warm', c)
                                              : c.textMuted
                                    }
                                    mono
                                />
                            ))}
                        </Row>
                    </Row>
                </Card>

                <BarChart
                    c={c}
                    width={284}
                    height={368}
                    title="Wall Time vs. Compute"
                    subtitle="Parallelism cuts delay, not total work"
                    yAxisLabel="Seconds (s)"
                    min={0}
                    max={9}
                    format={(v) => `${Math.round(v)}s`}
                    showGrid
                    showValues
                    data={[
                        { label: 'Serial wall', value: 6.0, valueLabel: '6.0s', color: cWarm },
                        { label: 'DAG wall', value: 3.0, valueLabel: '3.0s', color: cGreen },
                        { label: 'Total work', value: 6.0, valueLabel: '6.0s', color: cDiff },
                    ]}
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
