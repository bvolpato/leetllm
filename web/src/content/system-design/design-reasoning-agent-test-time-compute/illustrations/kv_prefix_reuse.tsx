import React from 'react'
import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 860
export const height = 500
export const alt =
    'Prefix KV cache reuse in test-time compute. Eight 16k reasoning branches share a 12k prompt stem. Without sharing, eight separate stems plus suffixes consume 40 GiB. With Radix prefix tree sharing, one physical 12k stem is retained with reference count 8, cutting total KV memory to 13.75 GiB, saving 65.6% memory.'

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme),
        a = canvas(k, width, height)

    // Header
    a.text(40, 36, 'Radix KV Prefix Sharing across 8 Parallel Reasoning Branches', {
        size: 22,
        weight: 700,
    })
    a.text(
        40,
        62,
        'Prompt Stem: 12k tokens (3.75 GiB) · Suffix Continuations: 4k tokens each (1.25 GiB each at 320 KiB/token)',
        { size: 16, color: k.mid },
    )

    // Left Panel: Radix Prefix Tree Structure
    a.rect(40, 85, 370, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(60, 115, 'Prefix Tree Page Sharing', { size: 18, weight: 650, color: k.state })

    // Stem block
    a.rect(60, 140, 160, 52, { fill: tint(k.state, 0.25), stroke: k.state, width: 2, r: 6 })
    a.text(140, 158, 'Shared Stem', { size: 17, weight: 700, align: 'center', color: k.state })
    a.text(140, 178, '12,000 tokens', { size: 15, align: 'center', color: k.mid })

    // Ref count pill
    a.rect(235, 150, 145, 32, { fill: tint(k.pass, 0.2), stroke: k.pass, r: 4 })
    a.text(307, 166, 'Ref Count = 8', { size: 15, weight: 700, align: 'center', color: k.pass })

    // Connection arrows from stem to suffixes
    const suffixY = [225, 275, 325, 375]
    const labels = ['Branch 1 (+4k)', 'Branch 2 (+4k)', 'Branches 3..7', 'Branch 8 (+4k)']

    suffixY.forEach((y, i) => {
        a.path(`M220 166 H245 V${y + 18} H260`, k.line)
        a.arrow(260, y + 18, 275, y + 18, k.prefill)
        a.rect(275, y, 115, 36, { fill: tint(k.decode, 0.2), stroke: k.decode, r: 4 })
        a.text(332, y + 18, labels[i], { size: 14, weight: 600, align: 'center', color: k.ink })
    })

    // Suffix dots indicator
    a.dot(180, 240, 3, k.mid)
    a.dot(180, 270, 3, k.mid)
    a.dot(180, 300, 3, k.mid)

    // Tree summary text
    a.rect(60, 422, 330, 36, { fill: tint(k.state, 0.1), stroke: k.line, r: 4 })
    a.text(225, 440, '1 Stem in VRAM + 8 Dynamic Suffixes', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.state,
    })

    // Right Panel: Memory Comparison Chart
    a.rect(430, 85, 390, 385, { fill: tint(k.c.bg, 0.05), stroke: k.line, r: 8 })
    a.text(450, 115, 'KV Cache Memory Footprint Comparison', {
        size: 18,
        weight: 650,
        color: k.ink,
    })

    // Bar 1: Unshared (Naive)
    a.text(450, 155, 'Unshared Branches (8 separate stems + 8 suffixes)', {
        size: 15,
        weight: 600,
        color: k.mid,
    })
    // Scale: 330px width = 40 GiB (8.25 px per GiB)
    const barWidth = 330
    const scale = barWidth / 40
    a.rect(450, 175, 30 * scale, 42, { fill: tint(k.fail, 0.45), stroke: k.fail, r: 4 })
    a.rect(450 + 30 * scale, 175, 10 * scale, 42, {
        fill: tint(k.decode, 0.4),
        stroke: k.decode,
        r: 4,
    })
    a.text(450 + 15 * scale, 196, '8 × 12k stems (30.0 GiB)', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })
    a.text(450 + 35 * scale, 196, '10 GiB', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })
    a.text(795, 196, '40.0 GiB', { size: 16, weight: 700, align: 'right', color: k.fail })

    // Bar 2: Shared Prefix
    a.text(450, 255, 'Shared Prefix (1 stem in cache + 8 suffixes)', {
        size: 15,
        weight: 600,
        color: k.mid,
    })
    a.rect(450, 275, 3.75 * scale, 42, { fill: tint(k.state, 0.6), stroke: k.state, r: 4 })
    a.rect(450 + 3.75 * scale, 275, 10 * scale, 42, {
        fill: tint(k.decode, 0.4),
        stroke: k.decode,
        r: 4,
    })
    a.text(450 + 1.875 * scale, 296, 'Stem', {
        size: 13,
        weight: 700,
        align: 'center',
        color: k.ink,
    })
    a.text(450 + 8.75 * scale, 296, '8 Suffixes (10.0 GiB)', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.ink,
    })
    a.text(450 + 13.75 * scale + 15, 296, '13.75 GiB', {
        size: 16,
        weight: 700,
        align: 'left',
        color: k.pass,
    })

    // Unallocated headroom indication
    a.rect(450 + 13.75 * scale, 275, 26.25 * scale, 42, {
        fill: tint(k.line, 0.15),
        stroke: k.line,
        dash: '4,4',
        r: 4,
    })
    a.text(450 + 27 * scale, 296, '26.25 GiB Freed VRAM', {
        size: 14,
        weight: 600,
        align: 'center',
        color: k.mid,
    })

    // Highlight metrics card
    a.rect(450, 350, 350, 95, { fill: tint(k.pass, 0.12), stroke: k.pass, width: 2, r: 6 })
    a.text(470, 380, 'Memory Reduction: -65.6%', { size: 19, weight: 700, color: k.pass })
    a.text(470, 408, 'Logical KV: 40.0 GiB  →  Physical KV: 13.75 GiB', {
        size: 15,
        mono: true,
        color: k.ink,
    })
    a.text(470, 430, 'Permits 2.9× concurrent reasoning beams in memory', {
        size: 14,
        color: k.mid,
    })

    return a.render()
}

export default create('dark')
