export const delta = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
] as const
export const terminal = (state: number) => state >= 8
export function transition(state: number, action: number) {
    const [dr, dc] = delta[action]!
    const row = Math.max(0, Math.min(2, Math.floor(state / 4) + dr))
    const col = Math.max(0, Math.min(3, (state % 4) + dc))
    const next = row * 4 + col
    return { next, reward: next === 11 ? 20 : next >= 8 ? -50 : -1 }
}
export function solve(slip = 0, count = 160) {
    let values = Array<number>(12).fill(0)
    const sweeps = [values.slice()]
    let q = Array.from({ length: 12 }, () => Array<number>(4).fill(0))
    for (let i = 0; i < count; i++) {
        q = values.map((_, state) =>
            delta.map((_, action) => {
                if (terminal(state)) return 0
                return [
                    [action, 1 - slip],
                    [(action + 1) % 4, slip / 2],
                    [(action + 3) % 4, slip / 2],
                ].reduce((sum, [move, probability]) => {
                    const { next, reward } = transition(state, move!)
                    return sum + probability! * (reward + 0.9 * values[next]!)
                }, 0)
            }),
        )
        values = q.map((row) => Math.max(...row))
        sweeps.push(values.slice())
    }
    return { values, q, sweeps }
}
