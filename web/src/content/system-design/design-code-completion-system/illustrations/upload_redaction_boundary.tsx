import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 390
export const alt =
    'Client-to-cloud redaction boundary. Inside client memory, a local scanner detects demo_api_token_abc123 in the buffer, masks it to placeholder <API_KEY_1>, and keeps the secret-to-placeholder map strictly local (aborting if a reserved placeholder already exists). Only the sanitized prompt crosses the TLS trust boundary to the gateway, KV cache, and FIM model. Server telemetry logs allowlisted fields (tenant, model, bucket) and excludes prompt text and raw secrets.'

export const numericAnchors = {
    sourceSecret: 'demo_api_token_abc123',
    placeholder: '<API_KEY_1>',
    clientBoundaryX: 430,
    telemetryAllowlist: ['tenant', 'model', 'bucket'],
    telemetryExcluded: ['prompt', 'raw_secret'],
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // Subtle background zone tints (semantic trust boundary, no heavy nested cards)
    fig.rect(18, 42, 396, 326, {
        fill: tint(blue, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 10,
    })
    fig.rect(466, 42, 396, 326, {
        fill: tint(purple, c.bg, 0.05),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 10,
    })

    // Zone titles
    fig.text(28, 22, 'Client Workstation (IDE Memory)', { size: 15, weight: 700, color: blue })
    fig.text(476, 22, 'Remote Gateway & Inference Cloud', { size: 15, weight: 700, color: purple })

    // Bold dashed TLS Trust Boundary
    fig.line(440, 26, 440, 376, { color: warm, width: 2, dash: '6 4' })
    fig.rect(404, 44, 72, 34, {
        fill: tint(warm, c.bg, 0.16),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 6,
    })
    fig.text(440, 55, 'TLS', { size: 12, weight: 700, color: warm, align: 'center' })
    fig.text(440, 69, 'egress', { size: 11, color: c.textSecondary, align: 'center' })

    // --- CLIENT SIDE ---
    // Step 1: Raw Buffer
    fig.rect(34, 60, 364, 68, {
        fill: tint(red, c.bg, 0.09),
        stroke: red,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(48, 79, '1. Active Editor Buffer (raw)', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(48, 105, "client = API('demo_api_token_abc123')", {
        size: 13,
        weight: 700,
        color: red,
        mono: true,
    })

    fig.arrow(216, 128, 216, 154, { color: c.textMuted, width: 1.6, head: 6 })

    // Step 2: Local Regex + Entropy Scanner
    fig.rect(34, 156, 364, 58, {
        fill: tint(blue, c.bg, 0.12),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(48, 175, '2. Local Scanner & Redactor', { size: 13, weight: 700, color: blue })
    fig.text(48, 197, 'Mask secret -> <API_KEY_1> · abort on collision', {
        size: 12,
        color: c.textSecondary,
    })

    // Split from Scanner: Down to Local Map (stays inside client) AND Right to Sanitized Egress
    fig.arrow(128, 214, 128, 250, { color: green, width: 1.6, head: 6 })
    fig.rect(34, 252, 206, 98, {
        fill: tint(green, c.bg, 0.12),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(46, 272, 'Local-Only Map', { size: 13, weight: 700, color: green })
    fig.text(46, 296, '<API_KEY_1> ->', { size: 12, weight: 700, color: c.textPrimary, mono: true })
    fig.text(46, 315, 'demo_api_token_abc123', { size: 11, color: red, mono: true })
    fig.text(46, 336, 'Never leaves client RAM', { size: 11, weight: 600, color: green })

    // Sanitized Outbound Payload (right of client zone, crosses TLS boundary cleanly!)
    fig.arrow(318, 214, 318, 250, { color: blue, width: 1.6, head: 6 })
    fig.rect(252, 252, 148, 98, {
        fill: tint(blue, c.bg, 0.14),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(264, 272, 'Sanitized Prompt', { size: 13, weight: 700, color: blue })
    fig.text(264, 298, "API('<API_KEY_1>')", {
        size: 12,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.text(264, 326, '0 raw credentials', { size: 12, color: c.textSecondary })

    // Cross-boundary arrow from Sanitized Prompt (x=400, y=300) cleanly up-and-over into Gateway (x=482, y=94)
    fig.path('M400 286 L422 286 L422 94 L478 94', { color: green, width: 2 })
    fig.arrow(464, 94, 480, 94, { color: green, width: 2, head: 6 })

    // --- SERVER SIDE ---
    // Step 3: Gateway & Tenant KV Cache
    fig.rect(482, 60, 364, 68, {
        fill: tint(purple, c.bg, 0.12),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(496, 80, '3. Gateway & Scoped KV Cache', { size: 13, weight: 700, color: purple })
    fig.text(496, 104, 'Hashes sanitized tokens only · no secret in KV', {
        size: 12,
        color: c.textSecondary,
    })

    fig.arrow(664, 128, 664, 154, { color: c.textMuted, width: 1.6, head: 6 })

    // Step 4: FIM Inference
    fig.rect(482, 156, 364, 68, {
        fill: tint(purple, c.bg, 0.08),
        stroke: c.border,
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.text(496, 176, '4. FIM Model Inference', { size: 13, weight: 700, color: c.textPrimary })
    fig.text(496, 200, 'Treats <API_KEY_1> as token · no auto-restore', {
        size: 12,
        color: c.textSecondary,
    })

    fig.arrow(664, 224, 664, 250, { color: c.textMuted, width: 1.6, head: 6 })

    // Step 5: Allowlisted Telemetry
    fig.rect(482, 252, 364, 98, {
        fill: tint(green, c.bg, 0.09),
        stroke: green,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(496, 272, '5. Allowlisted Telemetry Only', { size: 13, weight: 700, color: green })
    fig.text(496, 298, 'Log:   tenant, model, bucket', {
        size: 12,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.text(496, 324, 'Drop:  prompt, code, raw_secret', {
        size: 12,
        weight: 700,
        color: red,
        mono: true,
    })

    return fig.render()
}

export default create('dark')
