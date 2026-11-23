import React from 'react'
import { Scene, VectorArrow, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Vector DB Internals: HNSW & IVF. Separate diagrams contrast a layered graph search with selecting two inverted lists. LeetLLM.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const accent = theme === 'dark' ? c.primaryLight : c.primary
    const green = theme === 'dark' ? c.positiveLight : c.positive
    return <Scene c={c} background={c.bg} padding={48} gap={30} contentWidth={1104}>
        <div style={{ display: 'flex', color: c.textPrimary, fontSize: 47, lineHeight: 1.15, fontWeight: 750, letterSpacing: 0.3 }}>Vector DB Internals: HNSW &amp; IVF</div>
        <div style={{ position: 'relative', display: 'flex', width: 1104, height: 370 }}>
        <svg width={1104} height={370} viewBox="0 0 1104 370">
            <line x1={550} y1={20} x2={550} y2={355} stroke={c.border} strokeWidth={2} />
            {[105, 235, 365].map(x => <line key={x} x1={x} y1={112} x2={x} y2={284} stroke={c.border} strokeDasharray="5 6" />)}
            <line x1={105} y1={112} x2={365} y2={112} stroke={c.border} strokeWidth={3} />
            <line x1={105} y1={198} x2={365} y2={198} stroke={c.border} strokeWidth={3} />
            <line x1={40} y1={284} x2={430} y2={284} stroke={c.border} strokeWidth={3} />
            {VectorArrow({x1:126,y1:112,x2:344,y2:112,color:accent,strokeWidth:4,arrowSize:3})}
            {VectorArrow({x1:365,y1:135,x2:365,y2:176,color:accent,strokeWidth:4,arrowSize:3})}
            {VectorArrow({x1:365,y1:221,x2:365,y2:262,color:accent,strokeWidth:4,arrowSize:3})}
            {[{y:112,xs:[105,365]},{y:198,xs:[105,235,365]},{y:284,xs:[40,105,170,235,300,365,430]}].map(row => row.xs.map(x => <circle key={`${x}-${row.y}`} cx={x} cy={row.y} r={19} fill={c.bgCard} stroke={accent} strokeWidth={3} />))}
            {[0,1,2,3].map(row => [0,1,2,3,4,5].map(col => {
                const selected = row === 1 && (col === 2 || col === 3)
                return <rect key={`${row}-${col}`} x={620+col*70} y={82+row*61} width={53} height={44} rx={5} fill={selected ? green : c.bgCard} stroke={selected ? green : c.border} strokeWidth={2} />
            }))}
        </svg>
        <div style={{ position: 'absolute', left: 25, top: 12, width: 490, display: 'flex', color: accent, fontSize: 25, fontWeight: 700 }}>HNSW: follow graph links</div>
        <div style={{ position: 'absolute', left: 615, top: 12, width: 489, display: 'flex', color: green, fontSize: 25, fontWeight: 700 }}>IVF: choose inverted lists</div>
        <div style={{ position: 'absolute', left: 25, top: 327, width: 495, display: 'flex', color: c.textSecondary, fontSize: 21 }}>Sparse upper layers, wider base search</div>
        <div style={{ position: 'absolute', left: 615, top: 327, width: 489, display: 'flex', color: c.textSecondary, fontSize: 21 }}>Score candidates in selected lists</div>
        </div>
        <div style={{ display: 'flex', width: 1104, justifyContent: 'flex-end', color: accent, fontSize: 27, fontWeight: 700 }}>LeetLLM</div>
    </Scene>
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
