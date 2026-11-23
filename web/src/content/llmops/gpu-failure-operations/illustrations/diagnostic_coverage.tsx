import React from 'react'
import {
    Column,
    Matrix,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 720
export const height = 660
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A diagnostic gate matrix pairs pcie and nvbandwidth results from a single identified GPU run against optional extra memory tests. Only pcie Pass plus nvbandwidth Pass with no failing memory check clears the diagnostic gate; Skip, Not Run, Fail, Missing, or a separate memory Fail holds quarantine.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)

    return Scene({
        c: base,
        padding: 16,
        gap: 10,
        contentWidth: 688,
        children: Column({
            gap: 10,
            width: 688,
            children: [
                TextLabel({
                    c,
                    text: 'Diagnostic gates block recovery on Skip or Fail',
                    fontSize: 28,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Required run suite: pcie + nvbandwidth on quarantined GPU',
                    fontSize: 22,
                    color: base.textSecondary,
                }),
                Matrix({
                    c,
                    colorScale: 'heat',
                    colorDomain: [0, 2],
                    cellWidth: 136,
                    cellHeight: 54,
                    rowLabelWidth: 138,
                    fontSize: 21,
                    rowLabels: [
                        'Run A (Skip)',
                        'Run B (None)',
                        'Run C (Fail)',
                        'Run D (Extra)',
                        'Run E (All)',
                    ],
                    colLabels: ['pcie', 'nvbandwidth', 'memory', 'Gate'],
                    data: [
                        [0, 1, 1, 2],
                        [0, 1, 1, 2],
                        [0, 2, 1, 2],
                        [0, 0, 2, 2],
                        [0, 0, 0, 0],
                    ],
                    labels: [
                        ['Pass', 'Skip', 'n/a', 'HOLD'],
                        ['Pass', 'Not Run', 'n/a', 'HOLD'],
                        ['Pass', 'Fail', 'n/a', 'HOLD'],
                        ['Pass', 'Pass', 'Fail', 'HOLD'],
                        ['Pass', 'Pass', 'Pass', 'CLEAR'],
                    ],
                    highlightRow: 4,
                    ariaLabel: alt,
                }),
                TextLabel({
                    c,
                    text: 'Clean DCGM coverage satisfies one gate; identity and soak checks still apply.',
                    fontSize: 21,
                    color: base.textSecondary,
                }),
            ],
        }),
    })
}

export default create('dark')
