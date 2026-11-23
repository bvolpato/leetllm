import { arrow, assertEqual, column, dot, draw, fadeIn, fadeOut, film, place, rect, sceneArea, seq, text, to } from 'vizmatic/stage'
import { solve } from './gridworld'

export function bellmanFilm(theme: string) {
    const { sweeps } = solve(0, 4)
    assertEqual(Number(sweeps[4]![4]!.toFixed(2)), 11.87, 'start value after four sweeps')
    return film({ title: 'How the beacon teaches distant cells', look: theme === 'light' ? 'paper' : 'midnight', fps: 30, aspect: '16:9', font: 'text-serif' }, s => {
        const area = sceneArea({ left: -880, right: 880, top: -340, bottom: 360 })
        const [map, notes] = area.columns([1.9, 1], 80)
        const rows = map!.rows(3, 18)
        const cells = rows.flatMap(r => r.columns(4, 18))
        const title = place(text('How the beacon teaches distant cells', { size: 64 }), sceneArea({ left: -880, right: 880, top: -485, bottom: -400 }))
        s.add(title)
        cells.forEach((cell, i) => {
            s.add(rect(cell.width, cell.height, { fill: i >= 8 && i < 11 ? 'red' : i === 11 ? 'teal' : theme === 'light' ? '#e8e4dc' : '#203038', stroke: 'dim', width: 2, radius: 12 }).at(cell.cx, cell.cy).set('fillOpacity', i >= 8 ? 0.16 : 0.5))
            const tag = i === 11 ? 'GOAL' : i >= 8 ? 'CLIFF' : i === 4 ? 'START' : `(${Math.floor(i / 4)},${i % 4})`
            s.add(text(tag, { size: 31, color: i === 11 ? 'teal' : i >= 8 ? 'red' : 'dim' }).moveTo([cell.cx, cell.top + 38]))
            if (i >= 8) s.add(text(i === 11 ? '+20' : '−50', { size: 47, color: i === 11 ? 'teal' : 'red' }).moveTo([cell.cx, cell.cy + 25]))
        })
        let labels = cells.slice(0, 8).map(cell => text('0.00', { size: 43 }).moveTo([cell.cx, cell.cy + 25]))
        s.add(labels)
        let note = place(column([
            text('Start with zeros', { size: 43, color: 'blue' }),
            text('Every ordinary move: −1', { size: 30 }),
            text('Discount: 0.90', { size: 36 }),
        ], { gap: 28 }), notes!, 'center')
        s.add(note)
        s.chapter('A map of future returns')
        s.caption('Each cell stores its estimate of the return ahead. Begin with every estimate at zero.', 4)
        s.wait(4)
        for (let sweep = 1; sweep <= 4; sweep++) {
            s.chapter(`Sweep ${sweep}`)
            const source = sweep === 1 ? 11 : 9 - sweep
            const target = 8 - sweep
            const from = cells[source]!, dest = cells[target]!
            const begin: [number, number] = sweep === 1 ? [from.cx, from.top + 8] : [from.cx, from.cy + 60]
            const end: [number, number] = sweep === 1 ? [dest.cx, dest.bottom - 8] : [dest.cx, dest.cy + 60]
            const edge = arrow(begin, end, { stroke: 'yellow', width: 6, tip: 14 })
            const value = sweeps[sweep]![target]!
            const newNote = place(column([
                text(`Sweep ${sweep}`, { size: 44, color: 'blue' }),
                text(sweep === 1 ? 'Enter the goal' : 'Read the previous sweep', { size: 31 }),
                text(sweep === 1 ? '20 + 0.90 × 0' : `−1 + 0.90 × ${sweeps[sweep-1]![source]!.toFixed(2)}`, { size: 33 }),
                text(`= ${value.toFixed(2)}`, { size: 68, color: 'teal' }),
            ], { gap: 24 }), notes!, 'center')
            s.play(seq(fadeOut(note), fadeIn(newNote)), { duration: 0.6 })
            note = newNote
            s.play(draw(edge), { duration: 0.8 })
            const pulse = dot(10, 'yellow').at(...begin)
            s.add(pulse)
            s.play(to(pulse, n => n.at(...end)), { duration: 0.8 })
            const next = cells.slice(0,8).map((cell, i) => text(sweeps[sweep]![i]!.toFixed(2), { size: 43, color: i === target ? 'teal' : 'ink' }).moveTo([cell.cx, cell.cy + 25]))
            s.play(seq(fadeOut(labels), fadeIn(next)), { duration: 0.5 })
            labels = next
            s.caption(sweep === 1 ? 'The cell beside the beacon discovers a reward of twenty. The terminal state has no remaining return.' : `One more backup brings the reward a cell closer to the start. This value becomes ${value.toFixed(2)}.`, 4)
            s.wait(3)
            s.play(fadeOut([edge, pulse]), { duration: 0.3 })
        }
        s.caption('Four moves from the beacon, the start now knows the shortcut is worth 11.87. Each sweep extended the planning horizon by one move.', 5)
        s.wait(5)
    })
}
