import type { ThemeMode } from 'vizmatic'
import { createNcclAnimation, createNcclFrame } from '../nccl-collective-animation'

// Visual primitive: FlowArrow SVG scatter choreography
export const alt =
    'Animated reduce-scatter on the four-rank running example. Rank r sends chunks to the owners of each coordinate; each rank finishes with one completed scalar sum.'

export const width = 560
export const height = 390

export function createAnimation(theme: ThemeMode) {
    return createNcclAnimation(theme, 'reduce-scatter')
}

export function create(theme: ThemeMode = 'dark') {
    return createNcclFrame(theme, 'reduce-scatter')
}

export default create('dark')
