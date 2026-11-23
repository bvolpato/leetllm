import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { S, arrow, box, col, figure, kit, label, phrase, row, tint } from './_kit'

export const width = 640
export const height = 496
export const alt =
    'A search hit, eu-key-rotation-v2-rule, points to its parent section eu-access-v2 at revision eu-access/2026-04-01. The revision and the caller are checked again before the parent is read. The parent holds both conditions: up to 14 days after becoming stale, and a risk signal at most 48 hours old. A source map records it as E1 with its document, revision, locator, region, and access group.'

export function create(theme: ThemeMode = 'dark') {
    const k = kit(theme)
    const field = (name: string, value: string) =>
        row(
            <>
                {label(k, name, { size: S, color: k.mid, width: 102 })}
                {label(k, value, { mono: true })}
            </>,
        )
    const step = (text: string, color: string) =>
        row(
            <>
                <div style={{ display: 'flex', width: 34, justifyContent: 'center' }}>
                    {arrow(color, 28, 'down')}
                </div>
                {label(k, text, { size: S, color: k.mid, width: 570, style: { marginLeft: 6 } })}
            </>,
            { margin: '3px 0' },
        )
    return figure(
        k,
        <>
            {box(
                k,
                <>
                    {label(k, 'Search hit', { weight: 600, color: k.data })}
                    {label(k, 'eu-key-rotation-v2-rule', { mono: true })}
                    {field('parent', 'eu-access-v2')}
                    {field('revision', 'eu-access/2026-04-01')}
                </>,
                { color: k.data },
            )}
            {step('Same revision? May Luna read the parent? Check both again.', k.data)}
            {box(
                k,
                <>
                    {label(k, 'Parent section', { weight: 600 })}
                    {phrase(k, [
                        { text: 'Stale service-account keys qualify for automated rotation' },
                        { text: 'up to 14 days', fill: tint(k.ask, 0.24), weight: 600 },
                        { text: 'after becoming stale, provided the risk signal is' },
                        { text: 'at most 48 hours old.', fill: tint(k.model, 0.2), weight: 600 },
                    ])}
                </>,
                { color: k.ink },
            )}
            {step('Record the source under a short label the answer can cite.', k.go)}
            {box(
                k,
                row(
                    <>
                        {label(k, 'E1', {
                            size: 26,
                            mono: true,
                            weight: 700,
                            color: k.go,
                            width: 64,
                        })}
                        {col(
                            <>
                                {field('document', 'eu-access')}
                                {field('revision', 'eu-access/2026-04-01')}
                                {field('locator', 'EU Access Policy > key rotation')}
                                {field('scope', 'EU, support:eu')}
                            </>,
                            { gap: 1 },
                        )}
                    </>,
                ),
                { color: k.go, fill: true },
            )}
        </>,
        0,
    )
}
export default create('dark')
