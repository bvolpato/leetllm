import React from 'react'
import {
    Column,
    DataTable,
    GraphDiagram,
    Panel,
    Scene,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'GPU 0 stores experts E0 and E1; GPU 1 stores E2 and E3. Two token assignments run locally (t0 to E0 on GPU 0, t2 to E2 on GPU 1) with 0 network bytes. Three remote assignments (t1 from GPU 0 to E2, t3 from GPU 1 to E1, t4 from GPU 0 to E3) each move 8 KiB on dispatch and 8 KiB on combine, totaling 48 KiB.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Resident experts vs cross-GPU token routes',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    children: GraphDiagram({
                        c: cd,
                        width: 520,
                        height: 270,
                        padding: 8,
                        direction: 'TB',
                        groupDirection: 'LR',
                        nodeGap: 14,
                        rankGap: 32,
                        edgeGap: 10,
                        labelFontSize: 18,
                        detailFontSize: 18,
                        arrowSize: 7,
                        groups: [
                            { id: 'g0', label: 'GPU 0 (E0, E1)', tone: 'blue' },
                            { id: 'g1', label: 'GPU 1 (E2, E3)', tone: 'purple' },
                        ],
                        nodes: [
                            {
                                id: 'src0',
                                label: 'G0 toks',
                                detail: 't0, t1, t4',
                                group: 'g0',
                                tone: 'blue',
                            },
                            {
                                id: 'exp0',
                                label: 'Exp G0',
                                detail: 'E0, E1',
                                group: 'g0',
                                tone: 'blue',
                            },
                            {
                                id: 'src1',
                                label: 'G1 toks',
                                detail: 't2, t3',
                                group: 'g1',
                                tone: 'purple',
                            },
                            {
                                id: 'exp1',
                                label: 'Exp G1',
                                detail: 'E2, E3',
                                group: 'g1',
                                tone: 'purple',
                            },
                        ],
                        edges: [
                            { from: 'src0', to: 'exp0', label: 't0 (0 KiB)', tone: 'green' },
                            { from: 'src1', to: 'exp1', label: 't2 (0 KiB)', tone: 'green' },
                            {
                                from: 'src0',
                                to: 'exp1',
                                label: 't1,t4 (32 KiB)',
                                dashed: true,
                                tone: 'warm',
                            },
                            {
                                from: 'src1',
                                to: 'exp0',
                                label: 't3 (16 KiB)',
                                dashed: true,
                                tone: 'warm',
                            },
                        ],
                    }),
                }),
                Panel({
                    c: cd,
                    title: 'Application payload: 3 remote × 16 KiB = 48 KiB',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    children: DataTable({
                        c: cd,
                        width: 544,
                        headerRows: 1,
                        headerCols: 1,
                        cellHeight: 32,
                        gap: 4,
                        fontSize: 18,
                        rows: [
                            ['Assignment', 'Route', 'Placement', 'Roundtrip'],
                            ['t0 -> E0', 'G0 -> G0', 'local', '0 KiB'],
                            ['t2 -> E2', 'G1 -> G1', 'local', '0 KiB'],
                            ['t1, t4, t3', '3 remote', 'cross-GPU', '48 KiB (3×16)'],
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create('dark')
