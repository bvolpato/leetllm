import type { ThemeMode } from 'vizmatic'
import { draw, layoutHeight } from '../../../../src/content/training/constitutional-ai-automated-red-teaming/illustrations/authorization_boundary'
import { PRINT } from '../../../../src/content/training/constitutional-ai-automated-red-teaming/illustrations/_kit'

export const width = PRINT.W
export const height = layoutHeight(PRINT)
export const captionNotes: string[] = []
export const create = (theme: ThemeMode = 'light') => draw(theme, PRINT)
