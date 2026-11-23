import type { ThemeMode } from 'vizmatic'
import { draw, layoutHeight } from '../../../../src/content/training/supervised-fine-tuning-pipeline/illustrations/resume_checkpoint_stack'
import { PRINT } from '../../../../src/content/training/supervised-fine-tuning-pipeline/illustrations/_kit'

export const width = PRINT.W
export const height = layoutHeight(PRINT)
export const captionNotes: string[] = []
export const create = (theme: ThemeMode = 'light') => draw(theme, PRINT)
