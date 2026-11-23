import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 580
export const autoSize = false
export const alt =
    'A four-stage request path through an inference server: server.py starts the time-to-first-token timer, batch_scheduler.py holds requests until max_wait_ms expires, engine.py runs prefill, and metrics.py reports p99 latency. Keyword retrieval for time to first token reaches server.py and metrics.py but skips the scheduler that adds the delay.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth: 616,
        children: GraphDiagram({
            c,
            width: 616,
            height: 550,
            layout: 'auto',
            direction: 'TB',
            routing: 'dagre',
            rankGap: 28,
            nodeGap: 20,
            nodeWidth: 340,
            nodeHeight: 72,
            labelFontSize: 22,
            detailFontSize: 21,
            padding: 8,
            nodes: [
                {
                    id: 'server',
                    label: 'server.py',
                    detail: 'Starts TTFT timer',
                    tone: 'blue',
                },
                {
                    id: 'scheduler',
                    label: 'batch_scheduler.py',
                    detail: 'max_wait_ms holds requests',
                    tone: 'warm',
                },
                {
                    id: 'engine',
                    label: 'engine.py',
                    detail: 'Runs prefill',
                    tone: 'neutral',
                },
                {
                    id: 'metrics',
                    label: 'metrics.py',
                    detail: 'Reports p99',
                    tone: 'blue',
                },
            ],
            edges: [
                { from: 'server', to: 'scheduler', tone: 'blue' },
                { from: 'scheduler', to: 'engine', tone: 'warm' },
                { from: 'engine', to: 'metrics', tone: 'neutral' },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
