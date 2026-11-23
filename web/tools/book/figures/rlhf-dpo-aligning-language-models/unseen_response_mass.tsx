import type { ThemeMode } from 'vizmatic'
import { draw, layoutHeight } from '../../../../src/content/training/rlhf-dpo-aligning-language-models/illustrations/unseen_response_mass'
import { PRINT } from '../../../../src/content/training/rlhf-dpo-aligning-language-models/illustrations/_kit'

export const width = PRINT.W
export const height = layoutHeight(PRINT)
export const captionNotes: string[] = []
export const create = (theme: ThemeMode = 'light') => draw(theme, PRINT)
