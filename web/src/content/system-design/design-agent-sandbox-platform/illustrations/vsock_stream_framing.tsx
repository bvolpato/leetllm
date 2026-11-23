import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true
export const alt =
    'A host AF_UNIX endpoint sends the literal line CONNECT 5000 backslash-n to a guest listening on AF_VSOCK port 5000 through Firecracker. The acknowledgement OK 1073741824 backslash-n is shown as three stream fragments: OK space 1073, then 741, then 824 and newline. The existing reader requests one byte per recv and accumulates until newline, leaving following application bytes untouched. One whole two-second monotonic deadline and a 64-byte limit bound the acknowledgement. The full regular expression is OK space one or more decimal digits followed by newline, and the parsed host-side port must be at least 2 to the power 30 and less than 2 to the power 31. EOF, an invalid line or range, timeout, and excess length fail the handshake before application work.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const hostTone = getReadableToneColor('blue', c, c.bg)
    const guestTone = getReadableToneColor('purple', c, c.bg)
    const streamTone = getReadableToneColor('warm', c, c.bg)
    const okTone = getReadableToneColor('green', c, c.bg)
    const alertTone = getReadableToneColor('critical', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Socket Handshake Architecture */}
                    <rect
                        x={24}
                        y={60}
                        width={384}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={110}
                        width={170}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={hostTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={226}
                        y={110}
                        width={170}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={guestTone}
                        strokeWidth={1.5}
                    />

                    {/* Protocol messages */}
                    <rect
                        x={36}
                        y={230}
                        width={360}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={hostTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={36}
                        y={295}
                        width={360}
                        height={50}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={guestTone}
                        strokeWidth={1.2}
                    />

                    {/* Handshake notes */}
                    <rect
                        x={36}
                        y={365}
                        width={360}
                        height={95}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Right: Stream Framing & Accumulation */}
                    <rect
                        x={432}
                        y={60}
                        width={404}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Stream chunks */}
                    <rect
                        x={448}
                        y={110}
                        width={130}
                        height={45}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={streamTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={588}
                        y={110}
                        width={90}
                        height={45}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={streamTone}
                        strokeWidth={1.2}
                    />
                    <rect
                        x={688}
                        y={110}
                        width={136}
                        height={45}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={okTone}
                        strokeWidth={1.2}
                    />

                    {/* Delimiter boundary */}
                    <rect
                        x={448}
                        y={175}
                        width={376}
                        height={65}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={okTone}
                        strokeWidth={1.5}
                    />

                    {/* Safety enforcement list */}
                    <rect
                        x={448}
                        y={260}
                        width={376}
                        height={200}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={alertTone}
                        strokeWidth={1.2}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Vsock Stream Framing · Handshake & Strict Buffer Accumulation',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Panel */}
            {label(36, 75, 360, '1. Host-to-Guest Vsock Channel', 17, hostTone, 'left', 700)}

            {label(44, 120, 154, 'Host Supervisor', 13, hostTone, 'left', 650)}
            {label(44, 142, 154, 'AF_UNIX socket', 11, c.textPrimary)}
            {label(44, 160, 154, '/tmp/firecracker.vsock', 10, c.textMuted)}
            {label(44, 178, 154, 'Rootless jailer context', 10, c.textMuted)}

            {label(234, 120, 154, 'Guest MicroVM', 13, guestTone, 'left', 650)}
            {label(234, 142, 154, 'AF_VSOCK socket', 11, c.textPrimary)}
            {label(234, 160, 154, 'CID: 3 (Guest context)', 10, c.textMuted)}
            {label(234, 178, 154, 'Listening on port 5000', 10, c.textMuted)}

            {label(48, 245, 336, 'Host → Guest: CONNECT 5000\\n', 13, hostTone, 'left', 600)}
            {label(
                48,
                310,
                336,
                'Guest → Host: OK 1073741824\\n (Host port mapped)',
                13,
                guestTone,
                'left',
                600,
            )}

            {label(
                48,
                375,
                336,
                'Vsock is a byte stream, not a datagram protocol.',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                48,
                400,
                336,
                'Packets can be split arbitrarily across TCP/virtio buffers.',
                11,
                c.textMuted,
            )}
            {label(
                48,
                420,
                336,
                'Application bytes follow immediately after \\n.',
                11,
                streamTone,
                'left',
                600,
            )}

            {/* Right Panel */}
            {label(
                448,
                75,
                376,
                '2. Arbitrary Stream Fragments (ACK)',
                17,
                streamTone,
                'left',
                700,
            )}

            {label(456, 122, 114, '"OK 1073"', 12, streamTone, 'center', 600)}
            {label(596, 122, 74, '"741"', 12, streamTone, 'center', 600)}
            {label(696, 122, 120, '"824\\n"', 12, okTone, 'center', 700)}

            {label(
                458,
                185,
                356,
                'Accumulator: recv(1) up to \\n delimiter',
                13,
                okTone,
                'left',
                650,
            )}
            {label(
                458,
                208,
                356,
                'Leaves subsequent payload unconsumed in socket buffer.',
                11,
                c.textMuted,
            )}

            {label(458, 272, 356, 'Strict Handshake Safety Gates', 14, alertTone, 'left', 700)}
            {label(
                458,
                298,
                356,
                '• Max length: 64 bytes (protects memory against floods)',
                12,
                c.textPrimary,
            )}
            {label(
                458,
                320,
                356,
                '• Monotonic deadline: 2.0s timeout (prevents hang)',
                12,
                c.textPrimary,
            )}
            {label(458, 342, 356, '• Strict regex: ^OK ([0-9]+)\\n$', 12, c.textMuted)}
            {label(458, 364, 356, '• Port range check: 2³⁰ ≤ parsed_port < 2³¹', 12, c.textMuted)}
            {label(
                458,
                386,
                356,
                '• Any EOF, mismatch or error aborts handshake immediately',
                12,
                alertTone,
            )}
            {label(
                458,
                415,
                356,
                'Ensures zero untrusted payload executes before handshake verify',
                12,
                okTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
