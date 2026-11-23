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
    'A host VMM opens /dev/kvm, creates a VM descriptor, registers userspace memory, and creates a vCPU descriptor. KVM_RUN on that vCPU has distinct return paths. A negative return with EINTR checks shutdown before retrying; other errors stop. A zero return permits inspecting exit_reason. MMIO and IO go to userspace device handlers and then the loop. HLT follows guest lifecycle policy and can wait for an interrupt. Other unhandled exit reasons stop. Some hardware exits are handled inside KVM and never become a userspace return.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const kvmTone = getReadableToneColor('blue', c, c.bg)
    const errTone = getReadableToneColor('critical', c, c.bg)
    const exitTone = getReadableToneColor('purple', c, c.bg)
    const okTone = getReadableToneColor('green', c, c.bg)
    const retryTone = getReadableToneColor('warm', c, c.bg)

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
                    {/* Col 1: Setup & Run Loop */}
                    <rect
                        x={24}
                        y={60}
                        width={250}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={110}
                        width={226}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={kvmTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={185}
                        width={226}
                        height={60}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={kvmTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={260}
                        width={226}
                        height={90}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={kvmTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={370}
                        width={226}
                        height={90}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={okTone}
                        strokeWidth={2}
                    />

                    {/* Col 2: rc < 0 Branch */}
                    <rect
                        x={298}
                        y={60}
                        width={250}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={310}
                        y={110}
                        width={226}
                        height={160}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={retryTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={310}
                        y={290}
                        width={226}
                        height={170}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={errTone}
                        strokeWidth={1.5}
                    />

                    {/* Col 3: rc == 0 Exit Reason Branch */}
                    <rect
                        x={572}
                        y={60}
                        width={264}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={584}
                        y={110}
                        width={240}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={exitTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={584}
                        y={230}
                        width={240}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={kvmTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={584}
                        y={350}
                        width={240}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={errTone}
                        strokeWidth={1.5}
                    />

                    {/* Branching arrows */}
                    <line
                        x1={262}
                        y1={400}
                        x2={298}
                        y2={200}
                        stroke={retryTone}
                        strokeWidth={1.5}
                    />
                    <line x1={262} y1={420} x2={572} y2={200} stroke={exitTone} strokeWidth={1.5} />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'KVM Hypervisor vCPU Execution & Return Paths',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Col 1 */}
            {label(36, 75, 226, 'VMM Setup Loop', 17, kvmTone, 'left', 700)}
            {label(48, 118, 202, '/dev/kvm', 15, c.textPrimary, 'left', 650)}
            {label(48, 140, 202, 'Open KVM character dev', 13, c.textMuted)}

            {label(48, 193, 202, 'KVM_CREATE_VM', 15, c.textPrimary, 'left', 650)}
            {label(48, 215, 202, 'vm_fd + EPT page tables', 13, c.textMuted)}

            {label(48, 268, 202, 'Memory & vCPU Setup', 15, c.textPrimary, 'left', 650)}
            {label(48, 292, 202, '• KVM_SET_USER_MEMORY_REGION', 11, c.textMuted)}
            {label(48, 315, 202, '• KVM_CREATE_VCPU → vcpu_fd', 11, c.textMuted)}

            {label(48, 378, 202, 'ioctl(vcpu_fd, KVM_RUN)', 14, okTone, 'left', 700)}
            {label(48, 403, 202, 'Switches CPU to guest mode', 13, c.textPrimary)}
            {label(48, 426, 202, 'Hardware exits trap back to host', 12, c.textMuted)}

            {/* Col 2 */}
            {label(310, 75, 226, 'Return rc < 0 (Error)', 17, errTone, 'left', 700)}
            {label(322, 120, 202, 'errno == EINTR', 15, retryTone, 'left', 650)}
            {label(322, 145, 202, 'Host signal interrupted run', 13, c.textPrimary)}
            {label(322, 170, 202, '1. Check shutdown signal', 13, c.textMuted)}
            {label(322, 193, 202, '2. If shutting down: exit loop', 13, c.textMuted)}
            {label(322, 218, 202, '3. Else: safely re-run ioctl', 13, retryTone, 'left', 600)}

            {label(322, 300, 202, 'Other Errors (EFAULT/EINVAL)', 14, errTone, 'left', 650)}
            {label(322, 328, 202, 'Fatal hypervisor error', 13, c.textPrimary)}
            {label(322, 353, 202, '• Corrupt GPA mapping', 13, c.textMuted)}
            {label(322, 376, 202, '• Invalid vCPU register state', 13, c.textMuted)}
            {label(322, 405, 202, 'Immediate sandbox termination', 13, errTone, 'left', 600)}

            {/* Col 3 */}
            {label(584, 75, 240, 'Return rc == 0 (Exit Reason)', 17, exitTone, 'left', 700)}
            {label(596, 118, 216, 'MMIO / IO Trap', 15, exitTone, 'left', 650)}
            {label(596, 142, 216, 'virtio-vsock / device emulation', 13, c.textPrimary)}
            {label(596, 165, 216, 'Userspace handler fulfills IO → resume', 13, c.textMuted)}

            {label(596, 238, 216, 'KVM_EXIT_HLT', 15, kvmTone, 'left', 650)}
            {label(596, 262, 216, 'Guest CPU halted / idling', 13, c.textPrimary)}
            {label(596, 285, 216, 'Wait for virtual timer/interrupt', 13, c.textMuted)}

            {label(596, 358, 216, 'KVM_EXIT_SHUTDOWN / Other', 14, errTone, 'left', 650)}
            {label(596, 382, 216, 'Guest kernel panic or triple fault', 13, c.textMuted)}
            {label(596, 405, 216, 'Cleanly retire sandbox instance', 13, c.textMuted)}
            {label(596, 428, 216, 'Internal exits handled inside KVM', 12, c.textMuted)}
        </Board>
    )
}

export default create('dark')
