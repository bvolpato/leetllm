import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'A workflow diagram routes a loop inspecting manual slices inside a 3-step and 500-character limit through a strict completion check requiring boolean ready equals True and nonempty content, then runs registry claim matching to emit either verified output or abstention.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.3)
    return Scene({
        c,
        title: 'Completion Guard and Evidence Route',
        subtitle: 'Loop <= 3 steps, 500 chars; check ready is True, then match IDs',
        contentWidth: 720,
        gap: 10,
        padding: 14,
        children: [
            GraphDiagram({
                c,
                width: 720,
                height: 410,
                direction: 'TB',
                routing: 'orthogonal',
                nodeWidth: 215,
                nodeHeight: 36,
                rankGap: 14,
                nodeGap: 14,
                nodes: [
                    { id: 'shape', label: 'Shape: ready is True', tone: 'blue' },
                    { id: 'verify', label: 'Registry ID Match', tone: 'cyan' },
                    { id: 'reject', label: 'Reject "yes" / Empty', tone: 'critical' },
                    { id: 'pass', label: 'Verified Output', tone: 'green' },
                    { id: 'hold', label: 'Retry or Abstain', tone: 'warm' },
                ],
                edges: [
                    { from: 'shape', to: 'verify', label: 'Valid', tone: 'blue' },
                    { from: 'shape', to: 'reject', label: 'Bad flag', tone: 'critical' },
                    { from: 'verify', to: 'pass', label: 'Supported', tone: 'green' },
                    { from: 'verify', to: 'hold', label: 'Conflict', tone: 'warm' },
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
