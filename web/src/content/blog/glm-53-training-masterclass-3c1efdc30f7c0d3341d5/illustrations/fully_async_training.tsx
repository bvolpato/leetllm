import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/fully-async-film'

export const width = 800
export const height = 455
export const alt =
    'Fully asynchronous RL overlaps 48 rollout workers with 64 learner GPUs targeting staleness lag S of at most two updates. Trajectories tagged v130 arrive at learner steps 130, 131, and 132 within target lag zero to two, while a v129 trajectory arriving at step 132 exceeds lag two. A pause, weight sync, and resume cycle refreshes workers to v132.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')

    // ─── TOP HALF: Async Overlap Timeline + Weight Refresh Pause ─────────
    fig.text(28, 22, 'Async rollout overlap and periodic weight refresh', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    const trackX = 166
    const trackW = 602
    const rolloutY = 58
    const learnerY = 126
    const barH = 38

    // Vertical pause/sync window shaded band across both tracks
    const pauseX = trackX + 412
    const pauseW = 92
    fig.rect(pauseX, rolloutY - 12, pauseW, 126, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.14 : 0.18),
        stroke: warm,
        strokeWidth: 1.25,
        radius: 8,
    })
    fig.text(pauseX + pauseW / 2, rolloutY - 22, 'Weight refresh', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Track labels
    fig.text(trackX - 12, rolloutY + barH / 2 - 7, '48 Rollout', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(trackX - 12, rolloutY + barH / 2 + 11, 'workers', {
        size: 12.5,
        color: c.textSecondary,
        align: 'right',
    })

    fig.text(trackX - 12, learnerY + barH / 2 - 7, '64 Learner', {
        size: 13.5,
        weight: 700,
        color: blue,
        align: 'right',
    })
    fig.text(trackX - 12, learnerY + barH / 2 + 11, 'GPUs', {
        size: 12.5,
        color: c.textSecondary,
        align: 'right',
    })

    // Rollout track segments: continuous v130 -> paused -> resumed v132
    fig.rect(trackX, rolloutY, 404, barH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.2 : 0.26),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(trackX + 202, rolloutY + barH / 2, 'Generate trajectories tagged v130 (no cohort barrier)', {
        size: 13,
        weight: 600,
        color: green,
        align: 'center',
    })

    // Paused block inside refresh band
    fig.text(pauseX + pauseW / 2, rolloutY + barH / 2, 'Paused', {
        size: 12.5,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Resumed v132 block
    const resumeX = pauseX + pauseW + 8
    const resumeW = trackX + trackW - resumeX
    fig.rect(resumeX, rolloutY, resumeW, barH, {
        fill: tint(green, c.bg, theme === 'light' ? 0.24 : 0.32),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(resumeX + resumeW / 2, rolloutY + barH / 2, 'v132', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })

    // Learner track segments: L130, L131, L132 stepping concurrently
    const steps = [
        { x: trackX, w: 128, label: 'Step L130', sub: 'lag 0' },
        { x: trackX + 136, w: 128, label: 'Step L131', sub: 'lag 1' },
        { x: trackX + 272, w: 132, label: 'Step L132', sub: 'lag 2' },
    ]
    for (const st of steps) {
        fig.rect(st.x, learnerY, st.w, barH, {
            fill: tint(blue, c.bg, theme === 'light' ? 0.18 : 0.24),
            stroke: blue,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(st.x + st.w / 2, learnerY + barH / 2, st.label, {
            size: 13,
            weight: 700,
            color: blue,
            align: 'center',
            mono: true,
        })
        // Diagonal queue arrow from rollout stream to each learner step
        fig.arrow(st.x + 28, rolloutY + barH + 3, st.x + 56, learnerY - 4, {
            color: purple,
            width: 1.5,
            head: 6,
        })
    }

    // Weight sync arrow inside refresh band (Learner L132 -> Rollout workers)
    fig.arrow(pauseX + pauseW / 2, learnerY + 6, pauseX + pauseW / 2, rolloutY + barH + 6, {
        color: warm,
        width: 2.2,
        head: 7,
    })
    fig.text(pauseX + pauseW / 2, learnerY + 24, 'Sync v132', {
        size: 12,
        weight: 700,
        color: warm,
        align: 'center',
    })

    // Learner resumes L133
    fig.rect(resumeX, learnerY, resumeW, barH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.18 : 0.24),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(resumeX + resumeW / 2, learnerY + barH / 2, 'L133', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })

    // Subtle divider between timeline and staleness lag plot
    fig.line(28, 196, width - 28, 196, { color: c.borderSubtle, width: 1 })

    // ─── BOTTOM HALF: Weight Version Lag vs Staleness Ceiling S = 2 ──────
    fig.text(28, 218, 'Weight version lag at learner update (target S ≤ 2 steps)', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 90, y: 256, width: 670, height: 148 },
        { x: [0, 4], y: [0, 3.4] },
    )

    plot.axes({
        yTicks: [0, 1, 2, 3],
        yFormat: (v) => `${v}`,
        yLabel: 'Policy lag (steps)',
        grid: true,
        labelSize: 12.5,
    })

    // Horizontal dashed staleness target ceiling at lag = 2
    plot.hline(2, 'Target ceiling S = 2', {
        color: warm,
        labelColor: warm,
        labelPosition: 'left',
        labelOffset: 12,
        labelSize: 12.5,
        weight: 700,
    })

    const lags = [
        { label: 'v130 @ L130', lag: 0, badge: '0 (fresh)', color: green },
        { label: 'v130 @ L131', lag: 1, badge: '1 (ok)', color: green },
        { label: 'v130 @ L132', lag: 2, badge: '2 (limit)', color: warm },
        { label: 'v129 @ L132', lag: 3, badge: '3 (over limit)', color: red },
    ]

    const barW = 78
    lags.forEach((item, i) => {
        const cx = plot.px(i + 0.5)
        const baseY = plot.py(0)
        const topY = plot.py(item.lag)
        const h = item.lag === 0 ? 5 : baseY - topY

        fig.rect(cx - barW / 2, item.lag === 0 ? baseY - 5 : topY, barW, h, {
            fill: item.color,
            radius: 5,
        })

        fig.text(cx, (item.lag === 0 ? baseY - 5 : topY) - 14, item.badge, {
            size: 13,
            weight: 700,
            color: item.color,
            align: 'center',
            mono: true,
        })

        fig.text(cx, plot.bottom + 20, item.label, {
            size: 13,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            mono: true,
        })
    })

    return fig.render()
}

export default create('dark')
