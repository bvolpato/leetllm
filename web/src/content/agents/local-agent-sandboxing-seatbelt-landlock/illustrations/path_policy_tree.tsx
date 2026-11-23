import React from 'react'
import {
    Card,
    Column,
    Matrix,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 740
export const alt =
    'Workspace path policy tree showing resolved paths relative to the project root: src/app.py succeeds, dot-dot traversal to sibling .ssh/authorized_keys escapes the root and fails, writes inside .git/hooks, .git/config, and .vscode/tasks.json fail protected-target checks, and .env is configured though unexercised in the script.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    return Scene({
        c,
        padding: 16,
        gap: 12,
        children: Column({
            gap: 12,
            width: 648,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Resolved-Path Policy Check Under Workspace Root',
                    fontSize: 23,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    width: 648,
                    gap: 12,
                    align: 'stretch',
                    children: [
                        Card({
                            c,
                            tone: 'critical',
                            width: 248,
                            padding: 12,
                            gap: 4,
                            shadow: false,
                            children: Column({
                                gap: 4,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Sibling Host Dir',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: '../.ssh/authorized_keys',
                                        fontSize: 20,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Blocked outside root',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                    }),
                                ],
                            }),
                        }),
                        Card({
                            c,
                            tone: 'blue',
                            width: 388,
                            padding: 12,
                            gap: 4,
                            shadow: false,
                            children: Column({
                                gap: 4,
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Workspace Root (resolved)',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Allowed: src/app.py',
                                        fontSize: 20,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Protected: .git/hooks, .git/config, .vscode, .env',
                                        fontSize: 20,
                                        color: c.textPrimary,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'PathValidator Ancestor and Root Containment Results',
                    fontSize: 21,
                    fontWeight: 700,
                    color: c.textSecondary,
                }),
                Matrix({
                    c,
                    rowLabelWidth: 168,
                    cellWidth: 160,
                    cellHeight: 50,
                    fontSize: 20,
                    colorScale: 'strength',
                    colorDomain: [0, 2],
                    rowLabels: [
                        '1. src/app.py',
                        '2. ../.ssh/keys',
                        '3. .git/hooks',
                        '4. .git/config',
                        '5. .vscode/tasks',
                        '6. .env (rule)',
                    ],
                    colLabels: ['Resolved Target', 'Rule Check', 'Outcome'],
                    data: [
                        [2, 2, 2],
                        [0, 0, 0],
                        [0, 0, 0],
                        [0, 0, 0],
                        [0, 0, 0],
                        [1, 1, 1],
                    ],
                    labels: [
                        ['Under repo', 'Allowed subtree', 'Allow (stdout)'],
                        ['Leaves root', 'relative_to err', 'Block (stdout)'],
                        ['In hooks dir', 'Denied subtree', 'Block (stdout)'],
                        ['Exact target', 'Denied file', 'Assert only'],
                        ['In .vscode', 'Denied subtree', 'Block (stdout)'],
                        ['Exact target', 'Configured', 'Untested'],
                    ],
                }),
                Card({
                    c,
                    tone: 'green',
                    width: 648,
                    padding: 10,
                    shadow: false,
                    children: TextLabel({
                        c,
                        text: 'Path checks explain policy intent; real enforcement requires Landlock or read-only mounts against TOCTOU races.',
                        fontSize: 20,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
