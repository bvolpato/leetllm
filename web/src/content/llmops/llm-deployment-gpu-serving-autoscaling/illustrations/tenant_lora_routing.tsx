import React from 'react'
import {
    Column,
    GraphDiagram,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 530
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'Multi-tenant LoRA serving isolation on a shared base-v7 model: verified tenant credentials validate current group membership and compatible adapter metadata to select adapter_A_v3 (ID 101) or adapter_B_v2 (ID 102) with isolated prefix cache_salt values, while rejecting raw X-Tenant-ID headers, revoked members, or mismatched base checkpoints with 403.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)

    return Scene({
        c: base,
        padding: 16,
        gap: 10,
        contentWidth: 668,
        children: Column({
            gap: 10,
            width: 668,
            children: [
                TextLabel({
                    c,
                    text: 'Bind verified tenant membership to immutable LoRA and cache salt',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                GraphDiagram({
                    c: base,
                    width: 668,
                    height: 400,
                    nodeWidth: 206,
                    nodeHeight: 86,
                    labelFontSize: 23,
                    detailFontSize: 21,
                    padding: 8,
                    arrowSize: 6,
                    nodes: [
                        {
                            id: 'auth',
                            label: 'Principal',
                            detail: 'Ignore raw header',
                            x: 0.02,
                            y: 0.5,
                            tone: 'blue',
                        },
                        {
                            id: 'check',
                            label: 'Auth + Base',
                            detail: 'Active & base-v7',
                            x: 0.5,
                            y: 0.24,
                            tone: 'purple',
                        },
                        {
                            id: 'deny',
                            label: 'Reject 403',
                            detail: 'Revoked / wrong base',
                            x: 0.5,
                            y: 0.86,
                            tone: 'red',
                        },
                        {
                            id: 'loraA',
                            label: 'Adapter A v3 (101)',
                            detail: 'cache_salt = A',
                            x: 0.98,
                            y: 0.14,
                            tone: 'green',
                        },
                        {
                            id: 'loraB',
                            label: 'Adapter B v2 (102)',
                            detail: 'cache_salt = B',
                            x: 0.98,
                            y: 0.6,
                            tone: 'green',
                        },
                    ],
                    edges: [
                        { from: 'auth', to: 'check', tone: 'blue' },
                        { from: 'auth', to: 'deny', tone: 'red', style: 'dashed' },
                        { from: 'check', to: 'deny', tone: 'red', style: 'dashed' },
                        { from: 'check', to: 'loraA', tone: 'green' },
                        { from: 'check', to: 'loraB', tone: 'green' },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
