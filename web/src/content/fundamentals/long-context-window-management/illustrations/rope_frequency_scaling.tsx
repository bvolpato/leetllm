import { Column, getThemeColors, LineChart, Scene, TextLabel, withDensity } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 720
export const height = 760
export const alt =
    'Top chart shows 4x uniform position interpolation mapping extended indices 0, 8192, 16384, 24576, and 32768 linearly into the trained range 0 to 8192 via m/4. Bottom chart compares per-band angular step factors: uniform scaling reduces every band to 0.25, whereas YaRN keeps high-frequency bands near 1.0, ramps smoothly across middle bands, and scales low-frequency bands to 0.25.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 690,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 12,
                align: 'center',
                children: [
                    LineChart({
                        c,
                        title: '1 · 4× Position Interpolation (m′ = m / 4)',
                        width: 670,
                        height: 220,
                        labels: ['0', '8,192', '16,384', '24,576', '32,768'],
                        min: 0,
                        max: 9000,
                        format: (v) => `${Math.round(v)}`,
                        showPoints: true,
                        series: [
                            {
                                name: 'Mapped position m′',
                                points: [0, 2048, 4096, 6144, 8192],
                                color: c.primary,
                            },
                        ],
                    }),
                    LineChart({
                        c,
                        title: '2 · Angular step factor by RoPE frequency band',
                        width: 670,
                        height: 220,
                        labels: ['High ω', 'Band 2', 'Band 3', 'Band 4', 'Band 5', 'Low ω'],
                        min: 0,
                        max: 1.15,
                        format: (v) => v.toFixed(2),
                        showPoints: true,
                        directLabels: true,
                        series: [
                            {
                                name: 'YaRN ramp',
                                points: [1.0, 1.0, 0.75, 0.5, 0.25, 0.25],
                                color: c.positive,
                            },
                            {
                                name: 'Uniform PI',
                                points: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
                                color: c.warning,
                            },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'YaRN preserves local phase resolution while stretching long wavelengths',
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
