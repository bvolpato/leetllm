import React from 'react'
import {
    Canvas,
    Column,
    Panel,
    Row,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode, ToneName } from 'vizmatic'

export const width = 760
export const height = 490
export const alt =
    'Left panel shows an LSTM step where retain term 0.8379 and write term 0.0020 sum to cell c = 0.8399, while dropping output gate o from 0.80 to 0.10 cuts hidden h from 0.549 to 0.069 without changing c. Right panel compares GRU convex mixes h = z*h_old + (1-z)*h_tilde between h_old = 0.80 and candidate -0.20: +0.750 at z=0.95, +0.300 at z=0.50, and -0.150 at z=0.05.'

const LSTM_BARS: Array<{ label: string; val: number; txt: string; tone: ToneName }> = [
    { label: 'Cell c', val: 0.84, txt: '0.840', tone: 'blue' },
    { label: 'h (o=0.8)', val: 0.549, txt: '0.549', tone: 'green' },
    { label: 'h (o=0.1)', val: 0.069, txt: '0.069', tone: 'warm' },
]

const GRU_ROWS: Array<{ z: number; h: number; label: string; tone: ToneName }> = [
    { z: 0.95, h: 0.75, label: '+0.750', tone: 'blue' },
    { z: 0.5, h: 0.3, label: '+0.300', tone: 'green' },
    { z: 0.05, h: -0.15, label: '-0.150', tone: 'red' },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const zeroX = 36

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Row gap={12} align="stretch" width={740}>
                <Panel
                    title="LSTM: Cell c vs hidden h"
                    titleFontSize={25}
                    c={c}
                    width={364}
                    padding={12}
                    gap={10}
                    tone="blue"
                >
                    <TextLabel
                        c={c}
                        fontSize={23}
                        color={c.textSecondary}
                        text="c = 0.8379 + 0.0020 = 0.8399"
                    />
                    <Column gap={4}>
                        <TextLabel
                            c={c}
                            fontSize={23}
                            fontWeight={600}
                            text="Cell write vs retain share"
                        />
                        <svg width={336} height={28} viewBox="0 0 336 28">
                            <rect x={0} y={2} width={332} height={22} rx={5} fill={blue} />
                            <rect x={324} y={2} width={8} height={22} rx={3} fill={green} />
                        </svg>
                        <TextLabel
                            c={c}
                            fontSize={23}
                            mono
                            color={c.textSecondary}
                            text="Retain 0.838 | Write 0.002"
                        />
                    </Column>
                    <Column gap={12}>
                        {LSTM_BARS.map((b) => {
                            const col = getReadableToneColor(b.tone, c)
                            const w = Math.round(b.val * 130)
                            return (
                                <Row key={b.label} gap={6} align="center" justify="space-between">
                                    <div style={{ display: 'flex', width: 122 }}>
                                        <TextLabel
                                            c={c}
                                            fontSize={23}
                                            fontWeight={600}
                                            text={b.label}
                                        />
                                    </div>
                                    <svg width={136} height={24} viewBox="0 0 136 24">
                                        <rect
                                            x={0}
                                            y={3}
                                            width={130}
                                            height={18}
                                            rx={4}
                                            fill={c.bgSubtle}
                                            stroke={c.borderSubtle}
                                        />
                                        <rect x={0} y={3} width={w} height={18} rx={4} fill={col} />
                                    </svg>
                                    <div
                                        style={{
                                            display: 'flex',
                                            width: 64,
                                            justifyContent: 'flex-end',
                                        }}
                                    >
                                        <TextLabel
                                            c={c}
                                            fontSize={23}
                                            mono
                                            fontWeight={700}
                                            color={col}
                                            text={b.txt}
                                        />
                                    </div>
                                </Row>
                            )
                        })}
                    </Column>
                    <TextLabel
                        c={c}
                        fontSize={23}
                        mono
                        color={c.textMuted}
                        text="Output gate leaves c intact"
                    />
                </Panel>
                <Panel
                    title="GRU: Coupled convex mix"
                    titleFontSize={25}
                    c={c}
                    width={364}
                    padding={12}
                    gap={10}
                    tone="cyan"
                >
                    <TextLabel
                        c={c}
                        fontSize={23}
                        color={c.textSecondary}
                        text="h = z(0.80) + (1-z)(-0.20)"
                    />
                    <Column gap={14}>
                        {GRU_ROWS.map((r) => {
                            const col = getReadableToneColor(r.tone, c)
                            const len = Math.round(Math.abs(r.h) * 116)
                            const x = r.h >= 0 ? zeroX : zeroX - len
                            return (
                                <Column key={r.z} gap={3}>
                                    <Row justify="space-between" width={334}>
                                        <TextLabel
                                            c={c}
                                            fontSize={23}
                                            fontWeight={600}
                                            text={`z = ${r.z.toFixed(2)} (${Math.round(r.z * 100)}% keep)`}
                                        />
                                        <TextLabel
                                            c={c}
                                            fontSize={23}
                                            mono
                                            fontWeight={700}
                                            color={col}
                                            text={r.label}
                                        />
                                    </Row>
                                    <svg width={334} height={24} viewBox="0 0 334 24">
                                        <rect
                                            x={0}
                                            y={3}
                                            width={150}
                                            height={18}
                                            rx={4}
                                            fill={c.bgSubtle}
                                            stroke={c.borderSubtle}
                                        />
                                        <line
                                            x1={zeroX}
                                            y1={1}
                                            x2={zeroX}
                                            y2={23}
                                            stroke={c.textMuted}
                                            strokeWidth={1.5}
                                        />
                                        <rect
                                            x={x}
                                            y={4}
                                            width={len}
                                            height={16}
                                            rx={3}
                                            fill={col}
                                        />
                                        <rect
                                            x={166}
                                            y={4}
                                            width={Math.round(r.z * 160)}
                                            height={16}
                                            rx={3}
                                            fill={blue}
                                        />
                                        <rect
                                            x={166 + Math.round(r.z * 160)}
                                            y={4}
                                            width={Math.round((1 - r.z) * 160)}
                                            height={16}
                                            rx={3}
                                            fill={green}
                                        />
                                    </svg>
                                </Column>
                            )
                        })}
                    </Column>
                    <TextLabel
                        c={c}
                        fontSize={23}
                        mono
                        color={c.textMuted}
                        text="Left: signed h | Right: z vs (1-z)"
                    />
                </Panel>
            </Row>
        </Canvas>
    )
}
