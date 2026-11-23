import { spawnSync } from "node:child_process"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

export const KNOWN_MINIMATCH_V3_OVERREACH = Object.freeze({
    advisory: "GHSA-g3hv-75wg-m249",
    cve: "CVE-2026-118764",
    package: "minimatch",
    version: "3.1.5",
    path: ".>eslint-config-next>eslint-plugin-import>minimatch",
    vulnerableRange: "<11.0.1",
    patchedRange: ">=11.0.1",
})

const severityLevels = ["info", "low", "moderate", "high", "critical"]
const advisoryUrl = `https://github.com/advisories/${KNOWN_MINIMATCH_V3_OVERREACH.advisory}`
const fixUrl = "https://github.com/isaacs/minimatch/commit/77a0f5c4b80bdc641c3c930a1d9edf5ad2db57f8"

function failure(message) {
    return { status: "fail", message }
}

function vulnerabilityCount(report) {
    const counts = report?.metadata?.vulnerabilities
    if (!counts || typeof counts !== "object" || Array.isArray(counts)) return null
    if (!severityLevels.every((level) => Number.isSafeInteger(counts[level]) && counts[level] >= 0)) {
        return null
    }
    return severityLevels.reduce((sum, level) => sum + counts[level], 0)
}

function isKnownMinimatchV3Overreach(advisory) {
    const exception = KNOWN_MINIMATCH_V3_OVERREACH
    return advisory?.module_name === exception.package
        && advisory.github_advisory_id === exception.advisory
        && advisory.severity === "moderate"
        && advisory.vulnerable_versions === exception.vulnerableRange
        && advisory.patched_versions === exception.patchedRange
        && Array.isArray(advisory.cves)
        && advisory.cves.length === 1
        && advisory.cves[0] === exception.cve
        && Array.isArray(advisory.findings)
        && advisory.findings.length === 1
        && advisory.findings[0]?.version === exception.version
        && Array.isArray(advisory.findings[0]?.paths)
        && advisory.findings[0].paths.length === 1
        && advisory.findings[0].paths[0] === exception.path
}

export function classifyAuditResult({ stdout, exitCode, error = null, signal = null }) {
    if (error) return failure(`pnpm audit could not run: ${error}`)
    if (signal) return failure(`pnpm audit was terminated by signal ${signal}`)
    if (exitCode !== 0 && exitCode !== 1) {
        return failure(`pnpm audit exited with unexpected status ${String(exitCode)}`)
    }

    let report
    try {
        report = JSON.parse(stdout)
    } catch (parseError) {
        return failure(`pnpm audit returned malformed JSON: ${parseError.message}`)
    }

    if (!report || typeof report !== "object" || Array.isArray(report)) {
        return failure("pnpm audit JSON did not contain an object report")
    }
    const count = vulnerabilityCount(report)
    if (count === null || !report.advisories || typeof report.advisories !== "object" || Array.isArray(report.advisories)) {
        return failure("pnpm audit JSON did not include the expected advisory and severity-count fields")
    }

    const advisories = Object.values(report.advisories)
    if (exitCode === 0 && advisories.length === 0 && count === 0) {
        return { status: "pass_clean", findingCount: 0 }
    }

    if (exitCode === 1 && count === 1 && advisories.length === 1 && isKnownMinimatchV3Overreach(advisories[0])) {
        return {
            status: "pass_known_exception",
            findingCount: 1,
            exception: KNOWN_MINIMATCH_V3_OVERREACH,
            message: [
                `pnpm audit reports ${KNOWN_MINIMATCH_V3_OVERREACH.package}@${KNOWN_MINIMATCH_V3_OVERREACH.version} for ${KNOWN_MINIMATCH_V3_OVERREACH.advisory} at ${KNOWN_MINIMATCH_V3_OVERREACH.path}.`,
                "This exact v3 finding is a version-specific overreach: the advisory describes the minimatch 10.2.6 optimizationLevel>=2 preprocessing path, which is absent from the resolved v3.1.5 implementation. This exception does not treat the audit as vulnerability-free.",
                `Advisory: ${advisoryUrl}`,
                `Upstream fix: ${fixUrl}`,
            ].join("\n"),
        }
    }

    return failure(`pnpm audit found ${count} finding(s) outside the single reviewed minimatch@3.1.5 exception`)
}

export function runDependencyAudit({ command = "pnpm", spawn = spawnSync } = {}) {
    const result = spawn(command, ["audit", "--audit-level=low", "--json"], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
        shell: false,
    })

    if (result.stdout) process.stdout.write(result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\n`)
    if (result.stderr) process.stderr.write(result.stderr)

    const classified = classifyAuditResult({
        stdout: result.stdout ?? "",
        exitCode: result.status,
        error: result.error?.message ?? null,
        signal: result.signal,
    })

    if (classified.status === "pass_clean") {
        console.log("Dependency audit passed with no reported vulnerabilities.")
        return 0
    }
    if (classified.status === "pass_known_exception") {
        console.warn(`Dependency audit passed with one explicit known exception:\n${classified.message}`)
        return 0
    }

    console.error(`Dependency audit failed closed: ${classified.message}`)
    return 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    process.exitCode = runDependencyAudit()
}
