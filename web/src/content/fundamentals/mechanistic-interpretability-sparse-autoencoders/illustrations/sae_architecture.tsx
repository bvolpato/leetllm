/* eslint-disable @next/next/no-img-element -- Vizmatic embeds the typeset equations as local SVG data URIs. */
import React from 'react'
import {
    FlowArrow,
    Grid,
    Scene,
    TextLabel,
    Column,
    getReadableToneColor,
    getThemeColors,
    renderMathSvg,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 560
export const height = 700
export const alt =
    'A sparse autoencoder turns an 8-dimensional activation into a 64-slot code with an illustrative 19 active cells, then decodes it back to 8 dimensions. The encoder matrix is 64 by 8 and the decoder matrix is 8 by 64; an L1 training penalty encourages sparse codes.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const active = new Set([1, 4, 6, 9, 12, 15, 18, 21, 24, 27, 31, 34, 38, 41, 45, 50, 54, 59, 62])
    const inputTone = getReadableToneColor('purple', c, c.bg, c.bg)
    const activeTone = getReadableToneColor('warm', c, c.bg, c.bg)
    const outputTone = getReadableToneColor('green', c, c.bg, c.bg)
    const vector = (tone: 'purple' | 'green') =>
        Grid({
            c,
            cellWidth: 30,
            cellHeight: 20,
            gap: 5,
            rows: [Array.from({ length: 8 }, () => ({ label: '', tone }))],
        })
    const equation = (tex: string, alt: string, fontSize: number, color = c.textPrimary) => {
        const svg = renderMathSvg(tex, { fontSize, color })
        return (
            <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(svg.svg)}`}
                width={svg.width}
                height={svg.height}
                alt={alt}
            />
        )
    }

    return Scene({
        c,
        title: 'An SAE expands an activation into a sparse code',
        subtitle: '8 input dimensions · 64 candidate features · 8 reconstructed dimensions',
        padding: 12,
        gap: 8,
        align: 'center',
        contentWidth: 560,
        children: Column({
            width: 560,
            gap: 6,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'x ∈ ℝ⁸ · residual-stream activation',
                    width: 540,
                    fontSize: 22,
                    color: inputTone,
                    fontWeight: 750,
                    align: 'center',
                    mono: true,
                }),
                vector('purple'),
                FlowArrow({ c, direction: 'down', tone: 'blue', length: 17 }),
                equation(
                    String.raw`z = \mathrm{ReLU}(W_{\mathrm{enc}} x + b_{\mathrm{enc}})`,
                    'z equals ReLU of W encoder times x plus b encoder',
                    24,
                ),
                equation(
                    String.raw`W_{\mathrm{enc}} \in \mathbb{R}^{64 \times 8}`,
                    'W encoder is a 64 by 8 real-valued matrix with 64 encoder rows',
                    19,
                    c.textSecondary,
                ),
                FlowArrow({ c, direction: 'down', tone: 'warm', length: 17 }),
                Grid({
                    c,
                    cellWidth: 20,
                    cellHeight: 16,
                    gap: 4,
                    rows: Array.from({ length: 8 }, (_, row) =>
                        Array.from({ length: 8 }, (_, column) => ({
                            label: '',
                            tone: active.has(row * 8 + column) ? 'warm' : 'neutral',
                        })),
                    ),
                }),
                TextLabel({
                    c,
                    text: 'z ∈ ℝ⁶⁴ · illustrative mask with 19 active slots',
                    width: 540,
                    fontSize: 20,
                    color: activeTone,
                    fontWeight: 700,
                    align: 'center',
                    mono: true,
                }),
                TextLabel({
                    c,
                    text: 'The L1 term encourages a small active subset.',
                    width: 540,
                    fontSize: 19,
                    color: c.textSecondary,
                    align: 'center',
                }),
                FlowArrow({ c, direction: 'down', tone: 'green', length: 17 }),
                equation(
                    String.raw`\hat{x} = W_{\mathrm{dec}} z + b_{\mathrm{dec}}`,
                    'x hat equals W decoder times z plus b decoder',
                    24,
                ),
                equation(
                    String.raw`W_{\mathrm{dec}} \in \mathbb{R}^{8 \times 64}`,
                    'W decoder is an 8 by 64 real-valued matrix with 8 decoder rows',
                    19,
                    c.textSecondary,
                ),
                FlowArrow({ c, direction: 'down', tone: 'green', length: 17 }),
                equation(
                    String.raw`\hat{x} \in \mathbb{R}^{8}`,
                    'x hat is the reconstructed activation in eight dimensions',
                    22,
                    outputTone,
                ),
                vector('green'),
            ],
        }),
    })
}

export default create('dark')
