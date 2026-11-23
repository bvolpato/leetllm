import type { ThemeMode } from 'vizmatic'
import { createNcclAnimation, createNcclFrame } from '../nccl-collective-animation'

// Visual primitive: FlowArrow SVG reduction choreography
export const alt =
    'Animated four-rank all-reduce of the first vector slot. Values 1, 10, 100, and 1000 move into a logical sum; four copies of 1111 then sit on ranks 0 through 3.'

export const width = 560
export const height = 390

export function createAnimation(theme: ThemeMode) {
    return createNcclAnimation(theme, 'all-reduce')
}

export function create(theme: ThemeMode = 'dark') {
    return createNcclFrame(theme, 'all-reduce')
}

export default create('dark')
