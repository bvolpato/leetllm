import type { ThemeMode } from 'vizmatic'
import { createNcclAnimation, createNcclFrame } from '../nccl-collective-animation'

// Visual primitive: FlowArrow SVG routing choreography
export const alt =
    'Animated all-to-all on four ranks. Rank r holds four shards labeled r to 0, r to 1, r to 2, and r to 3. Each shard travels to the rank named in its destination index.'

export const width = 560
export const height = 390

export function createAnimation(theme: ThemeMode) {
    return createNcclAnimation(theme, 'all-to-all')
}

export function create(theme: ThemeMode = 'dark') {
    return createNcclFrame(theme, 'all-to-all')
}

export default create('dark')
