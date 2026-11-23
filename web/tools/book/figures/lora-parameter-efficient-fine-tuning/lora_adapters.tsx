import type { ThemeMode } from 'vizmatic'
import { draw, layoutHeight } from '../../../../src/content/training/lora-parameter-efficient-fine-tuning/illustrations/lora_adapters'
import { PRINT } from '../../../../src/content/training/lora-parameter-efficient-fine-tuning/illustrations/_kit'

export const width = PRINT.W
export const height = layoutHeight(PRINT)
export const captionNotes: string[] = []
export const create = (theme: ThemeMode = 'light') => draw(theme, PRINT)
