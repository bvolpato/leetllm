import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 600
export const alt =
    'Four completion rewards [1, 0, 0.5, 1] have population mean 0.625 and standard deviation about 0.4146. Subtracting the mean and dividing by the standard deviation yields signed advantages [+0.90, −1.51, −0.30, +0.90]. A uniform group [1, 1, 1, 1] has zero standard deviation and assigns zero reward advantage to every sample while a separate KL penalty remains active.'

const rewards = [1, 0, 0.5, 1]
const mean = rewards.reduce((sum, value) => sum + value, 0) / rewards.length
const std = Math.sqrt(rewards.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rewards.length)
const advantages = rewards.map((value) => (value - mean) / std)

export const layoutHeight = (L: Layout) => (L.print ? 310 : 600)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const H = layoutHeight(L)
    const padX = L.print ? 32 : 44
    const plotW = L.W - padX * 2
    const rewardY = L.print ? 52 : 108
    const rewardH = L.print ? 60 : 96
    const mapR = (value: number) => padX + 48 + value * (plotW - 96)

    k.t(padX, 16, plotW, 'Group rewards become signed advantages', {
        size: L.T,
        align: 'center',
        weight: 800,
    })
    k.t(padX, L.print ? 34 : 52, plotW, 'Normalized within prompt: Aᵢ = (rᵢ − μ) / σ', {
        size: L.S,
        align: 'center',
        color: c.textSecondary,
    })

    // Top panel: raw rewards on [0, 1] with dashed group mean.
    k.rect(padX, rewardY, plotW, rewardH, { fill: c.bgSubtle, stroke: c.border, rx: 8 })
    const axisY = rewardY + rewardH * 0.66
    k.line(mapR(0), axisY, mapR(1), axisY, { stroke: c.textSecondary, strokeWidth: 1.5 })
    k.line(mapR(mean), rewardY + (L.print ? 20 : 34), mapR(mean), rewardY + rewardH - 6, {
        stroke: k.ink('purple'),
        strokeWidth: 2,
        dash: '4 3',
    })
    ;[0, 0.5, 1].forEach((tick) => {
        const tx = mapR(tick)
        k.line(tx, axisY - 4, tx, axisY + 4, { stroke: c.textSecondary })
        k.t(tx - 24, axisY + 7, 48, tick.toFixed(1), {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    const yJitter = L.print ? [-6, 0, 0, 6] : [-10, 0, 0, 10]
    rewards.forEach((reward, i) => {
        const tone = reward > mean ? 'green' : reward < 0.25 ? 'critical' : 'purple'
        k.dot(mapR(reward), axisY + yJitter[i] - (L.print ? 5 : 8), L.print ? 4 : 6, {
            fill: k.ink(tone),
        })
    })
    k.t(padX + 12, rewardY + (L.print ? 4 : 6), 260, 'μ = 0.625 · σ = 0.4146', {
        size: L.S,
        color: k.ink('purple'),
        weight: 650,
    })

    // Bottom panel: diverging advantage bars from 0.
    const barBoxY = rewardY + rewardH + (L.print ? 16 : 36)
    const barBoxH = L.print ? 110 : 210
    k.rect(padX, barBoxY, plotW, barBoxH, { fill: c.bgSubtle, stroke: c.border, rx: 8 })
    const zeroY = barBoxY + barBoxH * 0.48
    const scaleY = (v: number) => zeroY - (v / 1.8) * (barBoxH * 0.38)
    k.line(padX + 20, zeroY, padX + plotW - 20, zeroY, {
        stroke: c.textSecondary,
        strokeWidth: 1.5,
    })
    const colW = (plotW - 40) / advantages.length
    advantages.forEach((adv, i) => {
        const cx = padX + 20 + (i + 0.5) * colW
        const tone = adv >= 0 ? 'green' : 'critical'
        const endY = scaleY(adv)
        k.arrow(cx, zeroY, cx, endY, { stroke: k.ink(tone), strokeWidth: L.print ? 4 : 7, size: 7 })
        const sign = adv >= 0 ? '+' : '−'
        const labelY = adv >= 0 ? endY - L.S * 1.45 : endY + 8
        k.t(cx - colW / 2, labelY, colW, `C${i + 1}  ${sign}${Math.abs(adv).toFixed(2)}`, {
            size: L.S,
            align: 'center',
            weight: 700,
            tone,
        })
    })

    // Footer: uniform group guard.
    const footY = barBoxY + barBoxH + (L.print ? 12 : 24)
    const footH = H - footY - (L.print ? 10 : 20)
    k.rect(padX, footY, plotW, footH, { fill: c.bgSubtle, stroke: c.border, rx: 8 })
    k.t(
        padX + 16,
        footY + (L.print ? 8 : 16),
        plotW - 32,
        'Uniform group [1, 1, 1, 1] → σ = 0 → A = [0, 0, 0, 0]',
        {
            size: L.S,
            align: 'center',
            weight: 650,
        },
    )
    k.t(
        padX + 16,
        footY + (L.print ? 24 : 50),
        plotW - 32,
        'A separate KL penalty still acts on the policy.',
        {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        },
    )

    return k.frame(H)
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
