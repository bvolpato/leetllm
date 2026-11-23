import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 520
export const autoSize = false
export const alt =
    'Left-to-right system diagram showing Prompt Rules (instructions and few-shot schema) and Indexed Docs (versioned chunks from RAG) entering the Inference Request, while SFT Dataset updates LoRA Adapter weights inside the Generator to produce a Grounded Answer.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth: 656,
        children: GraphDiagram({
            c,
            width: 656,
            height: 490,
            layout: 'auto',
            direction: 'LR',
            routing: 'dagre',
            rankGap: 34,
            nodeGap: 20,
            nodeWidth: 192,
            nodeHeight: 92,
            labelFontSize: 23,
            detailFontSize: 21,
            padding: 8,
            nodes: [
                {
                    id: 'prompt',
                    label: 'Prompt Rules',
                    detail: 'Schema + examples',
                    tone: 'blue',
                },
                {
                    id: 'rag',
                    label: 'Indexed Docs',
                    detail: 'Scoped v2.5 chunks',
                    tone: 'purple',
                },
                {
                    id: 'request',
                    label: 'Input Context',
                    detail: 'Question + evidence',
                    tone: 'neutral',
                },
                {
                    id: 'sft',
                    label: 'SFT Dataset',
                    detail: 'Trains LoRA weights',
                    tone: 'warm',
                },
                {
                    id: 'generator',
                    label: 'Generator',
                    detail: 'Weights + adapter',
                    tone: 'green',
                },
            ],
            edges: [
                { from: 'prompt', to: 'request', tone: 'blue' },
                { from: 'rag', to: 'request', tone: 'purple' },
                { from: 'request', to: 'generator', tone: 'neutral' },
                { from: 'sft', to: 'generator', tone: 'warm' },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
