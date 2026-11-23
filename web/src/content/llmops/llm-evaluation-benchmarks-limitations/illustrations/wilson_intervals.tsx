import { IntervalPlot, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 720
export const height = 520
export const alt =
    'Three observed pass rates and 95 percent Wilson score intervals share a 0.4 to 1.0 axis. Three of three passes has a lower bound of 0.438 despite 1.00 observed accuracy. Forty-nine of fifty spans 0.895 to 0.996, and 990 of 1000 spans 0.982 to 0.995.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.25),
        shadow: 'transparent',
    }
}

const illustration = defineIllustration((base) => {
    const c = prepTheme(base)
    return Scene({
        c,
        padding: 8,
        contentWidth: width - 48,
        children: IntervalPlot({
            c,
            width: width - 48,
            height: 410,
            min: 0.4,
            max: 1.0,
            format: 'decimal',
            axisLabel: '95% Wilson interval (true pass rate)',
            footer: 'Dot = observed rate; bar = 95% Wilson interval.',
            data: [
                {
                    label: '3 / 3',
                    low: 0.438,
                    mid: 1.0,
                    high: 1.0,
                    lowLabel: '0.438',
                    midLabel: '1.00',
                    highLabel: ' ',
                    color: 'warning',
                },
                {
                    label: '49 / 50',
                    low: 0.895,
                    mid: 0.98,
                    high: 0.996,
                    lowLabel: '0.895',
                    midLabel: '0.98',
                    highLabel: '0.996',
                    color: 'primary',
                },
                {
                    label: '990 / 1000',
                    low: 0.982,
                    mid: 0.99,
                    high: 0.995,
                    lowLabel: '0.982..0.995',
                    midLabel: '0.990',
                    highLabel: ' ',
                    color: 'positive',
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
