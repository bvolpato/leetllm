import { Comparison, GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 720
export const alt =
    'A root model sends generated Python code to an external REPL holding the corpus and variables, receives truncated previews back, delegates slices through plain llm_query or nested rlm_query calls, and merges structured answers.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.05)
    return Scene({
        c,
        title: 'Externalized Corpus Architecture',
        subtitle: 'Root writes code; child namespaces stay separate inside one sandbox',
        contentWidth: 720,
        gap: 14,
        padding: 16,
        children: [
            GraphDiagram({
                c,
                direction: 'TB',
                routing: 'orthogonal',
                rankGap: 14,
                nodeGap: 14,
                nodes: [
                    { id: 'corpus', label: 'Corpus Store', tone: 'neutral', icon: 'database' },
                    { id: 'root', label: 'Root LM', tone: 'blue', icon: 'agent' },
                    { id: 'repl', label: 'Python REPL', tone: 'purple', icon: 'terminal' },
                    { id: 'plain', label: 'llm_query', tone: 'cyan', icon: 'spark' },
                    { id: 'nested', label: 'rlm_query', tone: 'green', icon: 'layers' },
                ],
                edges: [
                    { from: 'corpus', to: 'repl', tone: 'neutral' },
                    { from: 'root', to: 'repl', tone: 'blue' },
                    { from: 'repl', to: 'plain', tone: 'cyan' },
                    { from: 'repl', to: 'nested', tone: 'green' },
                ],
            }),
            Comparison({
                c,
                sideWidth: 344,
                gap: 24,
                sides: [
                    {
                        title: 'Namespace Scope',
                        tone: 'purple',
                        lines: ['Variables stay isolated per REPL'],
                    },
                    {
                        title: 'Process Isolation',
                        tone: 'warm',
                        lines: ['Sandbox runs outside Python'],
                    },
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
