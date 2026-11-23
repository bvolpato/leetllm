import { renderDiagram, closeBrowser } from './tools/diagrams/lib/render.js'

// Test 1: Q/K/V projections with proper math
const diagram1 = `graph LR
    X["$$\\text{Input Embedding } x$$"] --> WQ["$$W_Q \\text{ projection}$$"]
    X --> WK["$$W_K \\text{ projection}$$"]
    X --> WV["$$W_V \\text{ projection}$$"]
    WQ --> Q["$$\\text{Query } (Q)$$"]
    WK --> K["$$\\text{Key } (K)$$"]
    WV --> V["$$\\text{Value } (V)$$"]

    style Q fill:#7c3aed,color:#fff,stroke:#6d28d9
    style K fill:#2563eb,color:#fff,stroke:#1d4ed8
    style V fill:#059669,color:#fff,stroke:#047857`

// Test 2: Attention computation with sqrt
const diagram2 = `graph LR
    QK["$$Q \\cdot K^T$$<br/>$$(n \\times n)$$"] --> Scale["$$\\div \\sqrt{d_k}$$"]
    Scale --> Mask["Mask<br/>(optional)"]
    Mask --> SM["$$\\text{softmax}$$<br/>(row-wise)"]
    SM --> MUL["$$\\times V$$"]
    MUL --> OUT["$$\\text{Output}$$<br/>$$(n \\times d_v)$$"]

    style QK fill:#7c3aed,color:#fff,stroke:#6d28d9
    style SM fill:#2563eb,color:#fff,stroke:#1d4ed8
    style OUT fill:#059669,color:#fff,stroke:#047857`

// Test 3: Multi-head attention with d_k formula
const diagram3 = `graph TB
    Input["$$\\text{Input } (B, N, d_{\\text{model}})$$"] --> Split["Split into $$h$$ heads"]
    Split --> H1["$$\\text{Head 1}$$<br/>$$d_k = d_{\\text{model}}/h$$"]
    Split --> H2["$$\\text{Head 2}$$<br/>$$d_k = d_{\\text{model}}/h$$"]
    Split --> H3["$$\\cdots$$"]
    Split --> Hh["$$\\text{Head } h$$<br/>$$d_k = d_{\\text{model}}/h$$"]
    H1 --> Concat["Concatenate"]
    H2 --> Concat
    H3 --> Concat
    Hh --> Concat
    Concat --> WO["$$W_O$$ projection"]
    WO --> Output["$$\\text{Output } (B, N, d_{\\text{model}})$$"]

    style Input fill:#1e293b,color:#fff,stroke:#334155
    style Output fill:#1e293b,color:#fff,stroke:#334155
    style Concat fill:#7c3aed,color:#fff,stroke:#6d28d9`

async function main() {
    const tests = [
        { diagram: diagram1, name: 'qkv_projections' },
        { diagram: diagram2, name: 'attention_computation' },
        { diagram: diagram3, name: 'multi_head' },
    ]

    for (const { diagram, name } of tests) {
        try {
            await renderDiagram(diagram, 'dark', `/tmp/test_${name}_dark.png`)
            await renderDiagram(diagram, 'light', `/tmp/test_${name}_light.png`)
            console.log(`✓ ${name}`)
        } catch (err) {
            console.error(`✗ ${name}:`, (err as Error).message)
        }
    }
    await closeBrowser()
}

main().catch(err => { console.error(err); process.exit(1) })
