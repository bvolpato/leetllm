import React from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
    getToneFill,
    withColorAlpha,
} from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    'Four-row visual comparison of post-training supervision signals for prompt 14 x 12 = 168: SFT applies dense per-token cross-entropy across every target token; RLHF scores a completion with a learned continuous scalar reward model r_phi before PPO; DPO directly widens the pairwise log-ratio margin between chosen 168 and rejected 148; RLVR runs a deterministic executable verifier producing exact binary 0 or 1 rewards for PPO or GRPO.'

export const width = 780
export const height = 430

const illustration = defineIllustration((c: ThemeColors) => {
    const boardW = 748
    const boardH = 398

    const blue = getToneColor('blue', c)
    const blueInk = getReadableToneColor('blue', c)
    const purple = getToneColor('purple', c)
    const purpleInk = getReadableToneColor('purple', c)
    const cyan = getToneColor('cyan', c)
    const cyanInk = getReadableToneColor('cyan', c)
    const green = getToneColor('green', c)
    const greenInk = getReadableToneColor('green', c)
    const warm = getToneColor('warm', c)

    const rowYs = [38, 130, 222, 314]
    const rowH = 78

    // Signal column geometry with room for single-line label + clear shafted arrow
    const sigX = 144
    const annX = sigX + 236
    const annW = 158
    const arrowX1 = 544
    const arrowX2 = 574
    const updX = 582
    const updW = 156

    const rows: Array<{ method: string; tone: ToneName; update: string }> = [
        { method: 'SFT', tone: 'blue', update: 'Token CE' },
        { method: 'RLHF', tone: 'purple', update: 'PPO' },
        { method: 'DPO', tone: 'cyan', update: 'Pair loss' },
        { method: 'RLVR', tone: 'green', update: 'PPO / GRPO' },
    ]

    const sftBars = [0.78, 0.92, 0.85, 0.68, 0.95]
    const rlvrBars = [1, 0, 0, 1]

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardW,
        align: 'center',
        background: 'transparent',
        children: Board({
            c,
            width: boardW,
            height: boardH,
            background: 'transparent',
            children: [
                <CanvasItem key="svg-signals" x={0} y={0} width={boardW} height={boardH}>
                    <svg width={boardW} height={boardH} viewBox={`0 0 ${boardW} ${boardH}`}>
                        {/* Opaque theme card backing + subtle tone tint per row */}
                        {rows.map((row, idx) => {
                            const y = rowYs[idx]
                            const accent = getToneColor(row.tone, c)
                            return (
                                <React.Fragment key={`row-bg-${row.method}`}>
                                    <SvgFrame
                                        c={c}
                                        x={4}
                                        y={y}
                                        width={boardW - 8}
                                        height={rowH}
                                        rx={10}
                                        fill={c.bgCard}
                                        stroke="none"
                                    />
                                    <SvgFrame
                                        c={c}
                                        x={4}
                                        y={y}
                                        width={boardW - 8}
                                        height={rowH}
                                        rx={10}
                                        fill={withColorAlpha(getToneFill(row.tone, c), 0.25)}
                                        stroke={withColorAlpha(accent, 0.55)}
                                        strokeWidth={1.25}
                                    />
                                </React.Fragment>
                            )
                        })}

                        {/* Row 1 (SFT): 5 dense per-token probability bars */}
                        {sftBars.map((val, i) => {
                            const bx = sigX + 12 + i * 42
                            const maxH = 44
                            const bh = Math.round(val * maxH)
                            const baseY = rowYs[0] + 62
                            return (
                                <React.Fragment key={`sft-b-${i}`}>
                                    <SvgFrame
                                        c={c}
                                        x={bx}
                                        y={baseY - maxH}
                                        width={28}
                                        height={maxH}
                                        rx={4}
                                        fill={withColorAlpha(c.borderSubtle, 0.45)}
                                        stroke="none"
                                    />
                                    <SvgFrame
                                        c={c}
                                        x={bx}
                                        y={baseY - bh}
                                        width={28}
                                        height={bh}
                                        rx={4}
                                        fill={blue}
                                        stroke="none"
                                    />
                                </React.Fragment>
                            )
                        })}

                        {/* Row 2 (RLHF): continuous learned scalar reward axis with uncertainty band */}
                        <line
                            x1={sigX + 14}
                            y1={rowYs[1] + 42}
                            x2={sigX + 220}
                            y2={rowYs[1] + 42}
                            stroke={c.borderLight}
                            strokeWidth={2.5}
                        />
                        <line
                            x1={sigX + 117}
                            y1={rowYs[1] + 32}
                            x2={sigX + 117}
                            y2={rowYs[1] + 52}
                            stroke={c.textMuted}
                            strokeWidth={1.5}
                        />
                        <SvgFrame
                            c={c}
                            x={sigX + 142}
                            y={rowYs[1] + 30}
                            width={52}
                            height={24}
                            rx={12}
                            fill={withColorAlpha(purple, 0.3)}
                            stroke={purple}
                            strokeWidth={1.2}
                        />
                        <SvgPoint
                            cx={sigX + 168}
                            cy={rowYs[1] + 42}
                            r={7}
                            fill={purple}
                            stroke={c.bg}
                            strokeWidth={2}
                        />

                        {/* Row 3 (DPO): opposing pairwise margin bars from center zero */}
                        <line
                            x1={sigX + 117}
                            y1={rowYs[2] + 16}
                            x2={sigX + 117}
                            y2={rowYs[2] + 64}
                            stroke={c.borderLight}
                            strokeWidth={2}
                        />
                        <SvgFrame
                            c={c}
                            x={sigX + 36}
                            y={rowYs[2] + 28}
                            width={79}
                            height={24}
                            rx={5}
                            fill={withColorAlpha(warm, 0.85)}
                            stroke="none"
                        />
                        <SvgFrame
                            c={c}
                            x={sigX + 119}
                            y={rowYs[2] + 28}
                            width={92}
                            height={24}
                            rx={5}
                            fill={cyan}
                            stroke="none"
                        />

                        {/* Row 4 (RLVR): exact binary {0, 1} verifier impulses */}
                        <line
                            x1={sigX + 12}
                            y1={rowYs[3] + 62}
                            x2={sigX + 222}
                            y2={rowYs[3] + 62}
                            stroke={c.borderLight}
                            strokeWidth={1.8}
                        />
                        {rlvrBars.map((val, i) => {
                            const bx = sigX + 20 + i * 50
                            const bh = val === 1 ? 44 : 6
                            const baseY = rowYs[3] + 62
                            return (
                                <React.Fragment key={`rlvr-b-${i}`}>
                                    <SvgFrame
                                        c={c}
                                        x={bx}
                                        y={baseY - bh}
                                        width={32}
                                        height={bh}
                                        rx={4}
                                        fill={val === 1 ? green : withColorAlpha(warm, 0.75)}
                                        stroke="none"
                                    />
                                </React.Fragment>
                            )
                        })}

                        {/* Shafted flow arrows to update column */}
                        {rows.map((row, idx) => (
                            <React.Fragment key={`arr-${row.method}`}>
                                <VectorArrow
                                    x1={arrowX1}
                                    y1={rowYs[idx] + rowH / 2}
                                    x2={arrowX2}
                                    y2={rowYs[idx] + rowH / 2}
                                    color={getToneColor(row.tone, c)}
                                    strokeWidth={2.5}
                                    arrowSize={5}
                                />
                            </React.Fragment>
                        ))}
                    </svg>
                </CanvasItem>,

                // Column headers
                <CanvasItem key="h-m" x={14} y={6} width={118} height={24}>
                    <TextLabel
                        c={c}
                        text="METHOD"
                        width={118}
                        fontSize={14}
                        fontWeight={800}
                        color={c.textMuted}
                        align="center"
                    />
                </CanvasItem>,
                <CanvasItem key="h-s" x={sigX + 12} y={6} width={380} height={24}>
                    <TextLabel
                        c={c}
                        text="SUPERVISION SIGNAL"
                        width={380}
                        fontSize={14}
                        fontWeight={800}
                        color={c.textMuted}
                        align="left"
                    />
                </CanvasItem>,
                <CanvasItem key="h-u" x={updX} y={6} width={updW} height={24}>
                    <TextLabel
                        c={c}
                        text="UPDATE"
                        width={updW}
                        fontSize={14}
                        fontWeight={800}
                        color={c.textMuted}
                        align="center"
                    />
                </CanvasItem>,

                // Left method pills & right update badges
                ...rows.map((row, idx) => {
                    const y = rowYs[idx] + 20
                    return (
                        <React.Fragment key={`pills-${row.method}`}>
                            <CanvasItem x={18} y={y} width={112} height={38}>
                                <BadgePill
                                    c={c}
                                    text={row.method}
                                    tone={row.tone}
                                    width={112}
                                    height={38}
                                    fontSize={18}
                                    filled
                                />
                            </CanvasItem>
                            <CanvasItem x={updX + 4} y={y} width={updW - 12} height={38}>
                                <BadgePill
                                    c={c}
                                    text={row.update}
                                    tone={row.tone}
                                    width={updW - 12}
                                    height={38}
                                    fontSize={16}
                                />
                            </CanvasItem>
                        </React.Fragment>
                    )
                }),

                // Crisp single-line signal annotations
                <CanvasItem key="ann-sft" x={annX} y={rowYs[0] + 26} width={annW} height={26}>
                    <TextLabel
                        c={c}
                        text="per-token log p(y*)"
                        width={annW}
                        fontSize={14.5}
                        fontWeight={750}
                        color={blueInk}
                        math
                    />
                </CanvasItem>,
                <CanvasItem key="ann-rlhf" x={annX} y={rowYs[1] + 26} width={annW} height={26}>
                    <TextLabel
                        c={c}
                        text="learned scalar r_φ"
                        width={annW}
                        fontSize={14.5}
                        fontWeight={750}
                        color={purpleInk}
                        math
                    />
                </CanvasItem>,
                <CanvasItem key="ann-dpo" x={annX} y={rowYs[2] + 26} width={annW} height={26}>
                    <TextLabel
                        c={c}
                        text="y⁻ vs y⁺ margin"
                        width={annW}
                        fontSize={14.5}
                        fontWeight={750}
                        color={cyanInk}
                        math
                    />
                </CanvasItem>,
                <CanvasItem key="ann-rlvr" x={annX} y={rowYs[3] + 26} width={annW} height={26}>
                    <TextLabel
                        c={c}
                        text="exact check {0, 1}"
                        width={annW}
                        fontSize={14.5}
                        fontWeight={750}
                        color={greenInk}
                    />
                </CanvasItem>,

                // Mini-axis end labels (numeric / symbol only)
                <CanvasItem key="rlhf-min" x={sigX + 10} y={rowYs[1] + 50} width={32} height={20}>
                    <TextLabel c={c} text="-2" width={32} fontSize={12} color={c.textMuted} mono />
                </CanvasItem>,
                <CanvasItem key="rlhf-max" x={sigX + 194} y={rowYs[1] + 50} width={32} height={20}>
                    <TextLabel
                        c={c}
                        text="+2"
                        width={32}
                        fontSize={12}
                        color={c.textMuted}
                        align="right"
                        mono
                    />
                </CanvasItem>,
                <CanvasItem key="dpo-neg" x={sigX + 36} y={rowYs[2] + 53} width={79} height={20}>
                    <TextLabel
                        c={c}
                        text="y⁻ (148)"
                        width={79}
                        fontSize={12}
                        fontWeight={700}
                        color={getReadableToneColor('warm', c)}
                        align="center"
                        math
                    />
                </CanvasItem>,
                <CanvasItem key="dpo-pos" x={sigX + 119} y={rowYs[2] + 53} width={92} height={20}>
                    <TextLabel
                        c={c}
                        text="y⁺ (168)"
                        width={92}
                        fontSize={12}
                        fontWeight={700}
                        color={cyanInk}
                        align="center"
                        math
                    />
                </CanvasItem>,
                <CanvasItem key="rlvr-0" x={sigX + 20} y={rowYs[3] + 2} width={32} height={18}>
                    <TextLabel
                        c={c}
                        text="1"
                        width={32}
                        fontSize={12}
                        fontWeight={800}
                        color={greenInk}
                        align="center"
                        mono
                    />
                </CanvasItem>,
                <CanvasItem key="rlvr-1" x={sigX + 70} y={rowYs[3] + 38} width={32} height={18}>
                    <TextLabel
                        c={c}
                        text="0"
                        width={32}
                        fontSize={12}
                        fontWeight={750}
                        color={getReadableToneColor('warm', c)}
                        align="center"
                        mono
                    />
                </CanvasItem>,
                <CanvasItem key="rlvr-2" x={sigX + 120} y={rowYs[3] + 38} width={32} height={18}>
                    <TextLabel
                        c={c}
                        text="0"
                        width={32}
                        fontSize={12}
                        fontWeight={750}
                        color={getReadableToneColor('warm', c)}
                        align="center"
                        mono
                    />
                </CanvasItem>,
                <CanvasItem key="rlvr-3" x={sigX + 170} y={rowYs[3] + 2} width={32} height={18}>
                    <TextLabel
                        c={c}
                        text="1"
                        width={32}
                        fontSize={12}
                        fontWeight={800}
                        color={greenInk}
                        align="center"
                        mono
                    />
                </CanvasItem>,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
