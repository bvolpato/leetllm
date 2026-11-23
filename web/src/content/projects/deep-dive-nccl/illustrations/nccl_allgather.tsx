import type { ThemeMode } from 'vizmatic'
import { createNcclAnimation, createNcclFrame } from '../nccl-collective-animation'

// Visual primitive: FlowArrow SVG animation choreography
export const alt =
    'Animated NCCL all-gather on the four-rank running example. Shards 1111, 2222, 3333, and 4444 leave their owners, concatenate in rank order, and then copies of that full tensor sit on every rank.'

export const width = 560
export const height = 390

export function createAnimation(theme: ThemeMode) {
    return createNcclAnimation(theme, 'all-gather')
}

export function create(theme: ThemeMode = 'dark') {
    return createNcclFrame(theme, 'all-gather')
}

export default create('dark')
