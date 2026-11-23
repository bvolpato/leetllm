import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    TiledMatrix,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Light-PEFT estimation begins with four heads, five pooled FFN coordinates, and rank four. After an early estimation window, it saves mask/score records and adapter weights. Slicing continues with three heads, three FFN coordinates, and ranks r2 plus r4.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)

    const cards = [
        { x: 25, y: 100, w: 250, h: 360, title: '1 · Baseline Model', tone: 'purple' as const },
        { x: 305, y: 100, w: 250, h: 360, title: '2 · Saved Artifacts', tone: 'warm' as const },
        {
            x: 585,
            y: 100,
            w: 250,
            h: 360,
            title: '3 · Sliced Architecture',
            tone: 'green' as const,
        },
    ]

    return Board({
        c,
        width,
        height,
        children: [
            // Background SVG and connector arrows
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <VectorArrow
                            x1={275}
                            y1={280}
                            x2={305}
                            y2={280}
                            color={tone('purple')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={555}
                            y1={280}
                            x2={585}
                            y2={280}
                            color={tone('green')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        {cards.map((card) => (
                            <rect
                                key={card.title}
                                x={card.x}
                                y={card.y}
                                width={card.w}
                                height={card.h}
                                rx="8"
                                fill={fill(card.tone)}
                                stroke={tone(card.tone)}
                                strokeWidth="1.5"
                            />
                        ))}
                    </svg>
                ),
            }),

            // Header titles
            CanvasItem({
                x: 25,
                y: 20,
                width: 810,
                height: 32,
                children: (
                    <TextLabel
                        c={c}
                        text="Light-PEFT Estimation and Slicing Lifecycle"
                        width={810}
                        fontSize={22}
                        fontWeight={700}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 25,
                y: 55,
                width: 810,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Early gradient estimation window captures sensitivity before structural parameter slicing"
                        width={810}
                        fontSize={14}
                        fontWeight={400}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Card 1: Baseline
            CanvasItem({
                x: 35,
                y: 115,
                width: 230,
                height: 26,
                children: (
                    <TextLabel
                        c={c}
                        text="1 · Full Baseline Model"
                        width={230}
                        fontSize={16}
                        fontWeight={700}
                        color={tone('purple')}
                    />
                ),
            }),
            CanvasItem({
                x: 35,
                y: 145,
                width: 230,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Full parameter initialization"
                        width={230}
                        fontSize={12}
                        color={c.textSecondary}
                    />
                ),
            }),
            CanvasItem({
                x: 35,
                y: 180,
                width: 100,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Heads (4)"
                        width={100}
                        fontSize={13}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 140,
                y: 175,
                width: 120,
                height: 30,
                children: <TiledMatrix c={c} rows={1} cols={4} cellSize={20} gap={4} tone="blue" />,
            }),
            CanvasItem({
                x: 35,
                y: 230,
                width: 100,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="FFN Pool (5)"
                        width={100}
                        fontSize={13}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 140,
                y: 225,
                width: 120,
                height: 30,
                children: <TiledMatrix c={c} rows={1} cols={5} cellSize={18} gap={3} tone="cyan" />,
            }),
            CanvasItem({
                x: 35,
                y: 280,
                width: 100,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="PEFT Rank (4)"
                        width={100}
                        fontSize={13}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 140,
                y: 275,
                width: 120,
                height: 30,
                children: (
                    <TiledMatrix c={c} rows={1} cols={4} cellSize={20} gap={4} tone="purple" />
                ),
            }),
            CanvasItem({
                x: 35,
                y: 340,
                width: 230,
                height: 40,
                children: (
                    <TextLabel
                        c={c}
                        text="Runs initial 5–10% warmup steps to accumulate importance scores"
                        width={230}
                        fontSize={11}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Card 2: Saved Artifacts
            CanvasItem({
                x: 315,
                y: 115,
                width: 230,
                height: 26,
                children: (
                    <TextLabel
                        c={c}
                        text="2 · Score & Mask Artifacts"
                        width={230}
                        fontSize={16}
                        fontWeight={700}
                        color={tone('warm')}
                    />
                ),
            }),
            CanvasItem({
                x: 315,
                y: 145,
                width: 230,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Serialized to peft_dir"
                        width={230}
                        fontSize={12}
                        color={c.textSecondary}
                    />
                ),
            }),
            ...[
                'early_attn_mask_records.npy',
                'early_ffn_mask_records.npy',
                'peft_module_records.pkl',
                'peft_mask_records.pkl',
                'adapter_model.bin',
            ].map((filename, idx) =>
                CanvasItem({
                    x: 315,
                    y: 180 + idx * 32,
                    width: 230,
                    height: 24,
                    children: (
                        <TextLabel
                            c={c}
                            text={filename}
                            width={230}
                            fontSize={12}
                            mono
                            color={tone('warm')}
                        />
                    ),
                }),
            ),
            CanvasItem({
                x: 315,
                y: 350,
                width: 230,
                height: 40,
                children: (
                    <TextLabel
                        c={c}
                        text="Quantiles thresholded into binary masks and rank projection records"
                        width={230}
                        fontSize={11}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Card 3: Sliced Model
            CanvasItem({
                x: 595,
                y: 115,
                width: 230,
                height: 26,
                children: (
                    <TextLabel
                        c={c}
                        text="3 · Sliced Pruned Model"
                        width={230}
                        fontSize={16}
                        fontWeight={700}
                        color={tone('green')}
                    />
                ),
            }),
            CanvasItem({
                x: 595,
                y: 145,
                width: 230,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Restored & sliced training"
                        width={230}
                        fontSize={12}
                        color={c.textSecondary}
                    />
                ),
            }),
            CanvasItem({
                x: 595,
                y: 180,
                width: 100,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Heads (3)"
                        width={100}
                        fontSize={13}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 700,
                y: 175,
                width: 120,
                height: 30,
                children: (
                    <TiledMatrix c={c} rows={1} cols={3} cellSize={20} gap={4} tone="green" />
                ),
            }),
            CanvasItem({
                x: 595,
                y: 230,
                width: 100,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="FFN Pool (3)"
                        width={100}
                        fontSize={13}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 700,
                y: 225,
                width: 120,
                height: 30,
                children: (
                    <TiledMatrix c={c} rows={1} cols={3} cellSize={18} gap={3} tone="green" />
                ),
            }),
            CanvasItem({
                x: 595,
                y: 280,
                width: 100,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Rank (r2 + r4)"
                        width={100}
                        fontSize={13}
                        fontWeight={600}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 700,
                y: 275,
                width: 120,
                height: 30,
                children: (
                    <TiledMatrix c={c} rows={1} cols={2} cellSize={20} gap={4} tone="green" />
                ),
            }),
            CanvasItem({
                x: 595,
                y: 340,
                width: 230,
                height: 40,
                children: (
                    <TextLabel
                        c={c}
                        text="Completes fine-tuning with reduced parameter footprint and memory pressure"
                        width={230}
                        fontSize={11}
                        color={c.textSecondary}
                    />
                ),
            }),
        ],
    })
}

export default create('dark')
