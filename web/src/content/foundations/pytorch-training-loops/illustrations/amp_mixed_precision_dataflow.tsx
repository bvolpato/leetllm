import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 445
export const alt =
    'CUDA AMP keeps stored parameters in float32 while eligible matrix operations use float16 and cross-entropy uses float32. With scale 65536, a true gradient norm of 2 becomes 131072 in the gradient buffer; unscale restores 2 before clipping to 1. Finite gradients update weights and hold or double scale after 2000 steps; non-finite gradients skip the update and halve the scale.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const fillAmt = theme === 'dark' ? 0.16 : 0.1

    const pill = (
        x: number,
        y: number,
        w: number,
        h: number,
        color: string,
        title: string,
        sub?: string,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(color, c.bg, fillAmt),
            stroke: color,
            strokeWidth: 1.6,
            radius: 9,
        })
        if (sub) {
            fig.text(x + w / 2, y + h / 2 - 10, title, {
                size: 13.5,
                weight: 700,
                color: c.textPrimary,
                align: 'center',
            })
            fig.text(x + w / 2, y + h / 2 + 12, sub, {
                size: 13,
                weight: 700,
                color,
                mono: true,
                align: 'center',
            })
        } else {
            fig.text(x + w / 2, y + h / 2, title, {
                size: 13.5,
                weight: 700,
                color,
                align: 'center',
            })
        }
    }

    // ─── BAND 1: AUTOCAST FORWARD PRECISION TRACK ───
    fig.text(20, 20, '1. Autocast dtype routing (master weights stay FP32)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    pill(20, 44, 204, 52, blue, 'Stored weights W', 'FP32 master')
    fig.arrow(226, 70, 276, 70, { color: purple, width: 2.3, head: 7 })
    fig.text(251, 56, 'cast', { size: 11.5, color: purple, align: 'center' })

    pill(280, 44, 212, 52, purple, 'Linear / MatMul', 'FP16 tensor cores')
    fig.arrow(494, 70, 544, 70, { color: blue, width: 2.3, head: 7 })
    fig.text(519, 56, 'upcast', { size: 11.5, color: blue, align: 'center' })

    pill(548, 44, 212, 52, blue, 'Cross-entropy loss', 'FP32 reduction')

    fig.line(20, 114, width - 20, 114, { color: c.borderSubtle, width: 1, dash: '4 4' })

    // ─── BAND 2: GRADSCALER MAGNITUDE GAUGE (true norm = 2, S = 65536, max_norm = 1) ───
    fig.text(20, 136, '2. GradScaler shifts tiny FP16 gradients above underflow, then unscales before clipping', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
    })

    // Visual magnitude bars (log10-like visual scale) showing norm 131072 -> 2 -> 1
    const gaugeY = 164
    const stages = [
        {
            x: 20,
            w: 222,
            title: 'scaled backward()',
            val: 'norm = 131,072',
            sub: 'true 2 × S (65,536)',
            barFrac: 1.0,
            color: warm,
        },
        {
            x: 279,
            w: 222,
            title: 'unscale_(opt)',
            val: 'norm = 2',
            sub: 'divide by S (÷ 65,536)',
            barFrac: 0.42,
            color: blue,
        },
        {
            x: 538,
            w: 222,
            title: 'clip_grad_norm_(1)',
            val: 'norm = 1',
            sub: 'clipped at max_norm = 1',
            barFrac: 0.24,
            color: green,
        },
    ]

    stages.forEach((st, i) => {
        fig.rect(st.x, gaugeY, st.w, 108, {
            fill: tint(st.color, c.bg, theme === 'dark' ? 0.12 : 0.07),
            stroke: st.color,
            strokeWidth: 1.5,
            radius: 10,
        })
        fig.text(st.x + 14, gaugeY + 20, st.title, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            mono: true,
        })
        // Visual norm bar
        const trackW = st.w - 28
        fig.rect(st.x + 14, gaugeY + 40, trackW, 14, {
            fill: tint(st.color, c.bg, 0.08),
            stroke: c.borderSubtle,
            strokeWidth: 0.8,
            radius: 4,
        })
        fig.rect(st.x + 14, gaugeY + 40, trackW * st.barFrac, 14, {
            fill: st.color,
            radius: 4,
        })
        fig.text(st.x + 14, gaugeY + 72, st.val, {
            size: 14,
            weight: 700,
            color: st.color,
            mono: true,
        })
        fig.text(st.x + 14, gaugeY + 93, st.sub, {
            size: 12,
            color: c.textSecondary,
        })

        if (i < stages.length - 1) {
            fig.arrow(st.x + st.w + 4, gaugeY + 54, stages[i + 1]!.x - 4, gaugeY + 54, {
                color: stages[i + 1]!.color,
                width: 2.3,
                head: 7,
            })
        }
    })

    // ─── BAND 3: FINITE VS INF/NAN BRANCH ───
    // Branch arrows coming down from unscale_ / clip
    fig.path(`M390 272 C390 304, 210 296, 210 326`, { color: green, width: 2.2 })
    fig.arrow(210, 316, 210, 329, { color: green, width: 2.2, head: 7 })
    fig.path(`M390 272 C390 304, 570 296, 570 326`, { color: critical, width: 2.2, dash: '5 3' })
    fig.arrow(570, 316, 570, 329, { color: critical, width: 2.2, head: 7 })

    fig.text(262, 290, 'all finite', { size: 12, weight: 700, color: green, align: 'center' })
    fig.text(532, 290, 'Inf / NaN detected', {
        size: 12,
        weight: 700,
        color: critical,
        align: 'center',
    })

    // Clean left-accent outcome strips (borderless editorial style)
    const outY = 334
    fig.rect(20, outY, 5, 92, { fill: green, radius: 2.5 })
    fig.rect(25, outY, 345, 92, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.1 : 0.06),
        radius: 6,
    })
    fig.text(40, outY + 20, 'Optimizer step runs', { size: 14, weight: 700, color: green })
    fig.text(40, outY + 46, 'W → W′ (FP32 update) · S unchanged', {
        size: 13,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(40, outY + 72, 'After 2,000 consecutive finite steps → S × 2', {
        size: 12.5,
        color: c.textSecondary,
    })

    fig.rect(410, outY, 5, 92, { fill: critical, radius: 2.5 })
    fig.rect(415, outY, 345, 92, {
        fill: tint(critical, c.bg, theme === 'dark' ? 0.1 : 0.06),
        radius: 6,
    })
    fig.text(430, outY + 20, 'Step skipped (overflow recovery)', {
        size: 14,
        weight: 700,
        color: critical,
    })
    fig.text(430, outY + 46, 'W held unchanged · S → S / 2', {
        size: 13,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(430, outY + 72, 'Next zero_grad() clears tainted .grad buffers', {
        size: 12.5,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
