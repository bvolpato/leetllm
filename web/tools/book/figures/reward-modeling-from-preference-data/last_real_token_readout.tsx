import type { ThemeMode } from 'vizmatic'
import {
    draw,
    layoutHeight,
} from '../../../../src/content/training/reward-modeling-from-preference-data/illustrations/last_real_token_readout'
import { PRINT } from '../../../../src/content/training/reward-modeling-from-preference-data/illustrations/_kit'

export const width = PRINT.W
export const height = layoutHeight(PRINT)
export const captionNotes: string[] = []
export const create = (theme: ThemeMode = 'light') => draw(theme, PRINT)
