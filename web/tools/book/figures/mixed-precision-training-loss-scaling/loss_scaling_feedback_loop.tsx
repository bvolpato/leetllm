import type { ThemeMode } from 'vizmatic'
import { draw, layoutHeight } from '../../../../src/content/training/mixed-precision-training-loss-scaling/illustrations/loss_scaling_feedback_loop'
import { PRINT } from '../../../../src/content/training/mixed-precision-training-loss-scaling/illustrations/_kit'

export const width = PRINT.W
export const height = layoutHeight(PRINT)
export const captionNotes: string[] = []
export const create = (theme: ThemeMode = 'light') => draw(theme, PRINT)
