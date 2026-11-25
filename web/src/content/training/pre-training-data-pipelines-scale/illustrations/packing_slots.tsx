import type { ThemeMode, ToneName } from 'vizmatic'
import { layoutAllocation, layoutCellGrid } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 435
export const alt =
    'Six variable-length documents (A=7, B=6, C=5, D=5, E=3, F=2; 28 tokens total) are placed into capacity-10 context blocks. Naive one-document-per-block padding requires 6 blocks (47% utilization, 32 padding tokens). Best-fit decreasing packs them into 3 blocks ([A+E]=10, [B+F]=8, [C+D]=10) for 93% utilization (only 2 padding tokens). A bottom counterexample shows three length-6 documents still leave 40% padding when documents cannot split across blocks.'

export const records = [7, 6, 5, 5, 3, 2].map((length, i) => ({
    id: String.fromCharCode(65 + i),
    length,
    tone: ['purple', 'blue', 'cyan', 'green', 'warm', 'neutral'][i] as ToneName,
}))

export function bestFit(items: typeof records) {
    const blocks: (typeof records)[] = []
    for (const record of [...items].sort((a, b) => b.length - a.length)) {
        const options = blocks.filter(
            (block) => block.reduce((sum, row) => sum + row.length, 0) + record.length <= 10,
        )
        options.sort(
            (a, b) =>
                b.reduce((sum, row) => sum + row.length, 0) -
                a.reduce((sum, row) => sum + row.length, 0),
        )
        if (options.length) options[0]!.push(record)
        else blocks.push([record])
    }
    return blocks
}

export const packed = bestFit(records)
export const awkward = [0, 1, 2].map((i) => [
    { id: 'counter-' + i, length: 6, tone: 'warm' as ToneName },
])

export const allRows = [
    ...records.map((record, i) => ({
        id: 'naive-' + record.id,
        label: record.id + ': ' + record.length,
        y: 80 + i * 36,
        records: [record],
        showIds: false,
    })),
    ...packed.map((block, i) => ({
        id: 'packed-' + i,
        label: 'Block ' + (i + 1),
        y: 80 + i * 54,
        records: block,
        showIds: true,
    })),
].map((row) => ({
    ...row,
    occupants: row.records.flatMap((record) => Array.from({ length: record.length }, () => record)),
    grid: layoutCellGrid({ x: 90, y: row.y, width: 220, height: 24, rows: 1, columns: 10 }),
    allocation: layoutAllocation({
        x: 90,
        y: row.y,
        width: 220,
        height: 24,
        capacity: 10,
        parts: row.records.map((record) => ({
            id: record.id,
            label: record.id,
            value: record.length,
        })),
    }),
}))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    const colMap: Record<string, string> = {
        A: purple,
        B: blue,
        C: cyan,
        D: green,
        E: warm,
        F: c.textSecondary,
    }

    const slotW = 20
    const binW = slotW * 10 // 200px = 10 slots

    const drawSlotsGrid = (x0: number, y0: number, h: number) => {
        fig.rect(x0, y0, binW, h, {
            fill: tint(c.textMuted, c.bg, 0.06),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 4,
        })
        for (let s = 1; s < 10; s++) {
            fig.line(x0 + s * slotW, y0, x0 + s * slotW, y0 + h, {
                color: c.borderSubtle,
                width: 0.75,
                opacity: 0.65,
            })
        }
    }

    // Naive padding (6 blocks, 47% used)
    const leftX = 76
    fig.text(16, 22, '1. Naive padding (6 blocks · 47%)', { size: 15.5, weight: 700 })
    fig.text(16, 44, '28 real tokens + 32 pad slots', { size: 14, color: warm, weight: 600 })

    records.forEach((rec, i) => {
        const y = 78 + i * 46
        const col = colMap[rec.id]!
        fig.text(leftX - 8, y + 15, `${rec.id}(${rec.length})`, {
            size: 14,
            mono: true,
            weight: 700,
            color: col,
            align: 'right',
        })
        drawSlotsGrid(leftX, y, 30)
        const w = rec.length * slotW
        fig.rect(leftX, y, w, 30, {
            fill: tint(col, c.bg, 0.36),
            stroke: col,
            strokeWidth: 1.4,
            radius: 4,
        })
        fig.text(leftX + w / 2, y + 15, rec.id, {
            size: 14,
            mono: true,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(leftX + binW + 8, y + 15, `${10 - rec.length} pad`, {
            size: 14,
            mono: true,
            color: muted,
        })
    })

    // Arrow from naive to best-fit
    fig.arrow(338, 206, 372, 206, { color: cyan, width: 2.2, head: 8 })

    // Best-Fit Decreasing (3 blocks, 93% used)
    const packX = 468
    fig.text(388, 22, '2. Best-fit packing (3 blocks · 93%)', { size: 15.5, weight: 700 })
    fig.text(388, 44, '28 real tokens + 2 pad (−94% waste)', {
        size: 14,
        color: green,
        weight: 600,
    })

    const packedBlocks = [
        { name: 'Block 1', items: [{ id: 'A', len: 7 }, { id: 'E', len: 3 }], pad: 0 },
        { name: 'Block 2', items: [{ id: 'B', len: 6 }, { id: 'F', len: 2 }], pad: 2 },
        { name: 'Block 3', items: [{ id: 'C', len: 5 }, { id: 'D', len: 5 }], pad: 0 },
    ]

    packedBlocks.forEach((b, i) => {
        const y = 80 + i * 52
        fig.text(packX - 8, y + 17, b.name, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
        })
        drawSlotsGrid(packX, y, 34)
        let cx = packX
        b.items.forEach((it) => {
            const w = it.len * slotW
            const col = colMap[it.id]!
            fig.rect(cx, y, w - 1, 34, {
                fill: tint(col, c.bg, 0.36),
                stroke: col,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(cx + w / 2, y + 17, `${it.id}(${it.len})`, {
                size: 14,
                mono: true,
                weight: 700,
                color: c.textPrimary,
                align: 'center',
            })
            cx += w
        })
        fig.text(packX + binW + 8, y + 17, b.pad === 0 ? '100%' : '80%', {
            size: 14,
            mono: true,
            weight: 700,
            color: b.pad === 0 ? green : warm,
        })
    })

    // No-split counterexample (3 x len-6 = 60% cap)
    fig.line(388, 252, width - 16, 252, { color: c.borderSubtle, width: 1 })
    fig.text(388, 274, 'No-split limit: three len-6 docs (60%)', {
        size: 14,
        weight: 700,
        color: warm,
    })
    ;[0, 1, 2].forEach((i) => {
        const y = 298 + i * 38
        fig.text(packX - 8, y + 13, `Doc ${i + 1}`, {
            size: 14,
            color: muted,
            align: 'right',
        })
        drawSlotsGrid(packX, y, 26)
        const w = 6 * slotW
        fig.rect(packX, y, w, 26, {
            fill: tint(warm, c.bg, 0.3),
            stroke: warm,
            strokeWidth: 1.3,
            radius: 3,
        })
        fig.text(packX + w / 2, y + 13, '6 tok', {
            size: 14,
            mono: true,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(packX + binW + 8, y + 13, '4 pad', {
            size: 14,
            mono: true,
            color: muted,
        })
    })

    // Slot ruler under naive stack
    const rY = 368
    fig.line(leftX, rY, leftX + binW, rY, { color: c.textMuted, width: 1 })
    ;[0, 5, 10].forEach((s) => {
        const tx = leftX + s * slotW
        fig.line(tx, rY, tx, rY + 4, { color: c.textMuted, width: 1 })
        fig.text(tx, rY + 18, `${s}`, { size: 14, mono: true, color: muted, align: 'center' })
    })
    fig.text(leftX + binW / 2, rY + 38, 'Block capacity (10 slots)', {
        size: 14,
        color: muted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
