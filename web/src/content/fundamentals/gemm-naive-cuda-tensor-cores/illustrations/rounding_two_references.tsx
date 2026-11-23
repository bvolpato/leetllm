import React from 'react'
import {
    BadgePill,
    Column,
    DataTable,
    FlowArrow,
    NumberLine,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 1020
export const height = 780
export const alt =
    'FP16 quantization spacing around 1,024 and the two GEMM validation references. Number line from 1,023 to 1,025 shows -0.375 rounding to 1023.5 (gap 0.5 below 1,024) and +0.25 rounding back to 1024 (FP16 gap = 1.0 above 1,024 versus FP32 spacing near 1.2e-4). Flow compares A=[1.0001,1], B=[1,-1]^T against Original FP64 (0.00010002, 100% relative error) and Rounded FP16->FP32 (cand = 0.0, exact pass).'

const gateRows = [
    ['Check', 'Target & Scope'],
    ['Ref 1', '5e-3, 2e-3 FP32'],
    ['Ref 2', 'Orig FP64 loss'],
    ['Cancel', '0 R1, 100% R2'],
]

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={12}>
            <Panel
                c={c}
                width={992}
                tone="warm"
                padding={12}
                gap={6}
                title="1,024 FP16 Spacing (-0.375->1023.5, +0.25->1024; FP32 ~1.2e-4)"
                titleFontSize={30}
            >
                <NumberLine
                    c={c}
                    min={1022.8}
                    max={1025.2}
                    width={960}
                    height={232}
                    ticks={[
                        { value: 1023, label: '1023.0' },
                        { value: 1023.5, label: '1023.5' },
                        { value: 1024, label: '1024.0' },
                        { value: 1025, label: '1025.0' },
                    ]}
                    markers={[
                        { id: 'drop', value: 1023.625, label: '-0.375', color: c.info },
                        { id: 'absorb', value: 1024.25, label: '+0.25', color: c.critical },
                    ]}
                    interval={{
                        from: 1024,
                        to: 1025,
                        includeFrom: true,
                        includeTo: true,
                        label: 'FP16 gap = 1.0',
                        color: c.warning,
                    }}
                />
            </Panel>

            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={504}
                    tone="cyan"
                    padding={12}
                    gap={10}
                    title="Cancellation: A=[1.0001,1], B=[1,-1]"
                    titleFontSize={30}
                >
                    <Column gap={8}>
                        <Row gap={8} align="center">
                            <BadgePill
                                c={c}
                                text="Orig FP64"
                                tone="neutral"
                                fontSize={30}
                                height={42}
                            />
                            <FlowArrow c={c} direction="right" length={18} tone="cyan" />
                            <BadgePill
                                c={c}
                                text="0.00010002"
                                tone="cyan"
                                fontSize={30}
                                height={42}
                            />
                        </Row>
                        <Row gap={8} align="center">
                            <BadgePill
                                c={c}
                                text="FP16 [1,1]"
                                tone="warm"
                                fontSize={30}
                                height={42}
                            />
                            <FlowArrow c={c} direction="right" length={18} tone="green" />
                            <BadgePill
                                c={c}
                                text="cand = 0.0"
                                tone="green"
                                fontSize={30}
                                height={42}
                            />
                        </Row>
                    </Column>
                    <BadgePill
                        c={c}
                        text="FP32 acc cannot undo FP16 loss"
                        tone="red"
                        fontSize={30}
                        height={40}
                    />
                </Panel>

                <Panel
                    c={c}
                    width={474}
                    tone="neutral"
                    padding={12}
                    gap={8}
                    title="Lab Validation Rules"
                    titleFontSize={30}
                >
                    <DataTable
                        c={c}
                        rows={gateRows}
                        firstColWidth={122}
                        cellWidth={316}
                        cellHeight={44}
                        gap={4}
                        fontSize={30}
                        headerRows={1}
                        headerCols={1}
                        align={['left', 'left']}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
