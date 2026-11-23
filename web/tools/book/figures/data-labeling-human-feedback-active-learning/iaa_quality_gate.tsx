import type { ThemeMode } from 'vizmatic'
import { draw, layoutHeight } from '../../../../src/content/llmops/data-labeling-human-feedback-active-learning/illustrations/iaa_quality_gate'
import { PRINT } from '../../../../src/content/llmops/data-labeling-human-feedback-active-learning/illustrations/_kit'

export const width = PRINT.W
export const height = layoutHeight(PRINT)
export const captionNotes: string[] = []
export const create = (theme: ThemeMode = 'light') => draw(theme, PRINT)
