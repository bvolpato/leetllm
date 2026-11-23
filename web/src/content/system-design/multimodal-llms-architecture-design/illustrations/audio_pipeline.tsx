import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 860
export const height = 500
export const alt =
    'Audio temporal compression pipeline. A forty-second audio waveform enters a 100 Hz frontend producing 4,000 acoustic frames. A 10:1 temporal striding connector compresses ten consecutive frames into one token state, emitting 400 audio tokens with preserved interval timestamps for language decoder fusion.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 32, 'Audio Pipeline: Temporal Striding & Token Compression', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        58,
        'Downsampling 100 Hz continuous acoustic frames into a bounded audio token sequence',
        { size: 15, color: k.mid },
    )

    // Column 1: Audio Signal & Frontend (Left)
    a.rect(40, 85, 230, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(56, 102, 105, 24, 'RAW INPUT', {
        fill: tint(k.decode, 0.15),
        stroke: tint(k.decode, 0.4),
        color: k.decode,
        weight: 700,
    })
    a.text(56, 148, 'Audio Clip (40s)', { size: 16, weight: 700, color: k.prefill })

    a.rect(56, 168, 198, 65, { fill: tint(k.prefill, 0.08), stroke: tint(k.prefill, 0.3), r: 6 })
    a.text(68, 192, '16 kHz Raw Waveform', { size: 15, weight: 700, color: k.prefill })
    a.text(68, 216, '40-second audio stream', { size: 15, color: k.mid })

    a.arrow(155, 233, 155, 255, k.prefill, { width: 1.5 })

    a.rect(56, 255, 198, 90, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
    a.text(68, 278, '100 Hz Filterbanks', { size: 15, weight: 700 })
    a.text(68, 302, '80-channel spectrogram', { size: 15, color: k.mid })
    a.text(68, 326, '40s × 100 Hz = 4,000 frames', { size: 15, weight: 600, color: k.prefill })

    a.rect(56, 360, 198, 95, { fill: tint(k.fail, 0.08), stroke: tint(k.fail, 0.25), r: 6 })
    a.text(68, 385, 'Context Window Trap', { size: 15, weight: 700, color: k.fail })
    a.text(68, 410, '4,000 raw frames would consume', { size: 15, color: k.mid })
    a.text(68, 432, 'nearly entire 4,096 context!', { size: 15, color: k.mid })

    // Column 2: Temporal Striding Connector (Center)
    a.rect(295, 85, 260, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(311, 102, 160, 24, '10:1 COMPRESSION', {
        fill: tint(k.wait, 0.15),
        stroke: tint(k.wait, 0.4),
        color: k.wait,
        weight: 700,
    })
    a.text(311, 148, 'Temporal Grouping', { size: 16, weight: 700, color: k.state })

    // Frame Stacking text
    a.text(311, 178, 'Frame Stacking / Strided 1D Conv:', { size: 15, color: k.mid })

    // Ten mini frame blocks
    const startX = 311
    for (let i = 0; i < 10; i++) {
        const color = i < 5 ? k.state : k.pass
        a.rect(startX + i * 22, 195, 18, 45, { fill: tint(color, 0.2), stroke: color, r: 2 })
    }
    a.text(311, 262, '10 frames (100 ms acoustic window)', { size: 15, color: k.mid })

    // Arrow down
    a.arrow(425, 275, 425, 305, k.state, { width: 2 })

    // Single compressed token
    a.rect(385, 305, 80, 50, { fill: tint(k.pass, 0.2), stroke: k.pass, r: 6 })
    a.text(425, 330, '1 Token', { size: 15, weight: 700, color: k.pass, align: 'center' })

    a.rect(311, 370, 228, 85, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
    a.text(321, 395, 'Timestamp Mapping Preserved', { size: 15, weight: 700, color: k.state })
    a.text(321, 420, 'Each state carries [t_start, t_end]', { size: 15, color: k.mid })
    a.text(321, 442, 'Crucial for audio citation grounding', { size: 15, color: k.mid })

    // Arrow 1 -> 2
    a.arrow(254, 300, 295, 300, k.prefill, { width: 2 })

    // Column 3: LLM Decoder Input (Right)
    a.rect(580, 85, 240, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.cell(596, 102, 150, 24, 'UNIFIED SEQUENCE', {
        fill: tint(k.pass, 0.15),
        stroke: tint(k.pass, 0.4),
        color: k.pass,
        weight: 700,
    })
    a.text(596, 148, 'Decoder Audio Prefix', { size: 16, weight: 700, color: k.pass })

    a.rect(596, 168, 208, 95, { fill: tint(k.pass, 0.08), stroke: tint(k.pass, 0.3), r: 6 })
    a.text(608, 192, '400 Audio Tokens', { size: 15, weight: 700, color: k.pass })
    a.text(608, 218, '4,000 frames ÷ 10 = 400 states', { size: 15, color: k.mid })
    a.text(608, 242, 'Rate: 10 tokens/second of audio', { size: 15, weight: 600, color: k.pass })

    // Arrow 2 -> 3
    a.arrow(555, 330, 596, 215, k.pass, { width: 2 })

    a.rect(596, 280, 208, 175, { fill: tint(k.c.bg, 0.1), stroke: k.line, r: 6 })
    a.text(608, 305, 'Modality Balancing', { size: 15, weight: 700 })
    a.text(608, 330, 'Matches conversational rate:', { size: 15, color: k.mid })
    a.text(608, 355, '• Human speech: ~3 words/sec', { size: 15, color: k.mid })
    a.text(608, 380, '• Audio tokens: 10 tokens/sec', { size: 15, color: k.mid })
    a.text(608, 410, 'Balances cross-attention density', { size: 15, color: k.mid })
    a.text(608, 435, 'without audio token dilution.', { size: 15, color: k.mid })

    return a.render()
}

export default create('dark')
