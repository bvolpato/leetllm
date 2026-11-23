import {
    Column,
    Flow,
    getThemeColors,
    Panel,
    Scene,
    StackedBar,
    TextLabel,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 760
export const height = 800
export const alt =
    'A prompt-budget pipeline reserves output tokens first, validates whether mandatory system instructions and the user query fit in the remaining input limit, packs complete recent turns intact, compacts older turns if needed, and recounts the serialized request. In a 16-unit window with 4 reserved output units and 11 mandatory units, only 1 free unit remains, so an older 13-unit turn (9 user plus 4 assistant) is omitted whole.'

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 730,
        padding: 8,
        gap: 6,
        children: [
            Column({
                gap: 8,
                align: 'center',
                children: [
                    Flow({
                        c,
                        direction: 'horizontal',
                        gap: 4,
                        connectorLength: 10,
                        stages: [
                            {
                                title: '1. Reserve',
                                subtitle: '4 output',
                                tone: 'purple',
                                width: 158,
                            },
                            { title: '2. Fit', subtitle: '≤ 12 input', tone: 'blue', width: 158 },
                            {
                                title: '3. Pack',
                                subtitle: 'newest turns',
                                tone: 'green',
                                width: 158,
                            },
                            { title: '4. Recount', subtitle: 'total', tone: 'neutral', width: 158 },
                        ],
                    }),
                    Panel({
                        c,
                        title: '16-unit budget (limit 14 raises ValueError)',
                        width: 710,
                        padding: 8,
                        gap: 4,
                        tone: 'purple',
                        children: [
                            StackedBar({
                                c,
                                width: 680,
                                height: 34,
                                segments: [
                                    { label: 'Mandatory (11)', value: 11, color: c.primary },
                                    { label: 'Free (1)', value: 1, color: c.info },
                                    { label: 'Output reserve (4)', value: 4, color: c.warning },
                                ],
                            }),
                        ],
                    }),
                    Panel({
                        c,
                        title: 'Older pair omitted whole (13 > 1 free slot)',
                        width: 710,
                        padding: 8,
                        gap: 4,
                        tone: 'neutral',
                        children: [
                            StackedBar({
                                c,
                                width: 680,
                                height: 34,
                                segments: [
                                    { label: 'User message (9)', value: 9, color: c.primary },
                                    { label: 'Assistant reply (4)', value: 4, color: c.accent },
                                ],
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Drop complete turns rather than splitting answers from questions',
                        fontSize: 23,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
