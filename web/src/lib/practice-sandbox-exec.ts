import { existsSync, readdirSync } from "fs"
import { spawn, spawnSync } from "child_process"
import type { ChildProcessWithoutNullStreams } from "child_process"

let bwrapAvailability: boolean | null = null

const READ_ONLY_SYSTEM_MOUNTS = [
    "/usr",
    "/bin",
    "/lib",
    "/lib64",
    "/etc/alternatives",
    "/etc/ssl",
    "/etc/ca-certificates",
    "/etc/ld.so.cache",
    "/etc/ld.so.conf",
    "/etc/ld.so.conf.d",
    "/etc/localtime",
]

function discoverReadOnlyMounts(envPath?: string): string[] {
    const mounts: string[] = []
    for (const candidate of READ_ONLY_SYSTEM_MOUNTS) {
        if (existsSync(/* turbopackIgnore: true */ candidate)) mounts.push(candidate)
    }
    try {
        for (const entry of readdirSync(/* turbopackIgnore: true */ "/etc")) {
            if (entry.startsWith("java")) {
                mounts.push(`/etc/${entry}`)
            }
        }
    } catch {
        // Ignore if /etc cannot be listed.
    }
    // Support Homebrew toolchains during local Linux development while keeping
    // the mount strictly read-only.
    if (envPath?.includes("/home/linuxbrew") && existsSync(/* turbopackIgnore: true */ "/home/linuxbrew")) {
        mounts.push("/home/linuxbrew")
    }
    return mounts
}

/**
 * Probes once whether Linux bubblewrap (`bwrap`) can create isolated user,
 * mount, PID, IPC, UTS, and network namespaces in the current kernel.
 */
export function isBwrapAvailable(): boolean {
    if (bwrapAvailability !== null) return bwrapAvailability
    const mode = (process.env.PRACTICE_SANDBOX_BWRAP || "auto").trim().toLowerCase()
    if (mode === "0" || mode === "false" || mode === "off" || process.platform !== "linux") {
        bwrapAvailability = false
        return false
    }

    const probe = spawnSync(
        "bwrap",
        [
            "--unshare-user",
            "--unshare-pid",
            "--unshare-net",
            "--unshare-ipc",
            "--unshare-uts",
            "--die-with-parent",
            "--new-session",
            "--ro-bind", "/", "/",
            "--tmpfs", "/tmp",
            "--proc", "/proc",
            "--dev", "/dev",
            "--",
            "/bin/true",
        ],
        { stdio: "ignore", timeout: 3000 },
    )
    bwrapAvailability = !probe.error && probe.status === 0
    return bwrapAvailability
}

export function resetBwrapAvailabilityCacheForTests() {
    bwrapAvailability = null
}

/**
 * Spawns a practice runtime command (`python3`, `javac`, or `java`) inside a
 * bubblewrap network/PID/mount/IPC/UTS namespace when supported by the Linux
 * kernel, falling back to a direct subprocess with stripped environment.
 */
export function spawnSandboxedProcess({
    command,
    args,
    workDir,
    env,
    useBwrap = isBwrapAvailable(),
}: {
    command: string
    args: string[]
    workDir: string
    env: NodeJS.ProcessEnv
    useBwrap?: boolean
}): { child: ChildProcessWithoutNullStreams; isolatedWithBwrap: boolean; sandboxWorkDir: string } {
    if (!useBwrap) {
        return {
            child: spawn(command, args, {
                cwd: workDir,
                stdio: ["pipe", "pipe", "pipe"],
                env,
            }),
            isolatedWithBwrap: false,
            sandboxWorkDir: workDir,
        }
    }

    const sandboxWorkDir = "/work"
    const bwrapArgs: string[] = [
        "--unshare-user",
        "--unshare-pid",
        "--unshare-net",
        "--unshare-ipc",
        "--unshare-uts",
        "--die-with-parent",
        "--new-session",
        "--clearenv",
    ]

    for (const mount of discoverReadOnlyMounts(env.PATH)) {
        bwrapArgs.push("--ro-bind", mount, mount)
    }

    bwrapArgs.push(
        "--tmpfs", "/tmp",
        "--bind", workDir, sandboxWorkDir,
        "--chdir", sandboxWorkDir,
        "--proc", "/proc",
        "--dev", "/dev",
    )

    for (const [key, value] of Object.entries(env)) {
        if (typeof value !== "string") continue
        const remapped = value === workDir ? sandboxWorkDir : value
        bwrapArgs.push("--setenv", key, remapped)
    }

    const remappedArgs = args.map((arg) => (
        arg.includes(workDir) ? arg.replaceAll(workDir, sandboxWorkDir) : arg
    ))
    bwrapArgs.push("--", command, ...remappedArgs)

    return {
        child: spawn("bwrap", bwrapArgs, {
            cwd: workDir,
            stdio: ["pipe", "pipe", "pipe"],
            env: { NODE_ENV: process.env.NODE_ENV || "production" } as NodeJS.ProcessEnv,
        }),
        isolatedWithBwrap: true,
        sandboxWorkDir,
    }
}
