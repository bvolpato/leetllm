/** The same small training run as the chapter's script, shared by its two figures. */
export const trainText = 'the queue held the request. the request left the queue. the reply reached the user. the user read the reply. '
export const valText = 'the driver held the lock. the worker left the pool. the user read the docs. '
export const chars = [...new Set(trainText + valText)].sort()
const index = new Map(chars.map((ch, i) => [ch, i]))
const V = chars.length
const pairs = (text: string) => [...text].slice(0, -1).map((ch, i) => [index.get(ch)!, index.get(text[i + 1]!)!] as const)
const trainPairs = pairs(trainText), valPairs = pairs(valText)

function softmax(z: readonly number[]): number[] {
    const top = Math.max(...z)
    const exponentials = z.map((value) => Math.exp(value - top))
    const total = exponentials.reduce((sum, value) => sum + value, 0)
    return exponentials.map((value) => value / total)
}

export function train(steps = 1000, rate = 2) {
    const logits = chars.map(() => chars.map(() => 0))
    const loss = (data: readonly (readonly [number, number])[]) => data.reduce((sum, [a, b]) => sum - Math.log(softmax(logits[a]!)[b]!), 0) / data.length
    const history: { step: number; train: number; val: number }[] = []
    let best = { val: Infinity, step: 0, table: logits.map((row) => softmax(row)) }
    for (let step = 0; step <= steps; step++) {
        const val = loss(valPairs)
        history.push({ step, train: loss(trainPairs), val })
        if (val < best.val) best = { val, step, table: logits.map((row) => softmax(row)) }
        const gradient = chars.map(() => chars.map(() => 0))
        for (const [a, b] of trainPairs) {
            const p = softmax(logits[a]!)
            for (let k = 0; k < V; k++) gradient[a]![k]! += p[k]!
            gradient[a]![b]! -= 1
        }
        for (let a = 0; a < V; a++) for (let k = 0; k < V; k++) logits[a]![k]! -= (rate * gradient[a]![k]!) / trainPairs.length
    }
    return { history, best }
}
