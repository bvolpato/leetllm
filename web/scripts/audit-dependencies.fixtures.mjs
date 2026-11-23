import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { classifyAuditResult, KNOWN_MINIMATCH_V3_OVERREACH } from "./audit-dependencies.mjs"

function auditRecord({
    advisory = KNOWN_MINIMATCH_V3_OVERREACH.advisory,
    packageName = KNOWN_MINIMATCH_V3_OVERREACH.package,
    version = KNOWN_MINIMATCH_V3_OVERREACH.version,
    findingPath = KNOWN_MINIMATCH_V3_OVERREACH.path,
    cve = KNOWN_MINIMATCH_V3_OVERREACH.cve,
    vulnerableRange = KNOWN_MINIMATCH_V3_OVERREACH.vulnerableRange,
    patchedRange = KNOWN_MINIMATCH_V3_OVERREACH.patchedRange,
}) {
    return {
        module_name: packageName,
        github_advisory_id: advisory,
        severity: "moderate",
        vulnerable_versions: vulnerableRange,
        patched_versions: patchedRange,
        cves: [cve],
        findings: [{ version, paths: [findingPath] }],
    }
}

function report(advisories) {
    const rows = Object.values(advisories)
    return JSON.stringify({
        advisories,
        metadata: {
            vulnerabilities: {
                info: 0,
                low: 0,
                moderate: rows.length,
                high: 0,
                critical: 0,
            },
        },
    })
}

describe("dependency audit exception classifier", () => {
    it("accepts only the exact known minimatch 3.1.5 overreach and names it explicitly", () => {
        const result = classifyAuditResult({
            stdout: report({ 1244012: auditRecord({}) }),
            exitCode: 1,
        })

        assert.equal(result.status, "pass_known_exception")
        assert.match(result.message, /minimatch@3\.1\.5/)
        assert.match(result.message, /not treat the audit as vulnerability-free/)
    })

    it("passes a clean audit only with exit status zero and zero findings", () => {
        const result = classifyAuditResult({
            stdout: JSON.stringify({
                advisories: {},
                metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } },
            }),
            exitCode: 0,
        })

        assert.equal(result.status, "pass_clean")
    })

    it("rejects a vulnerable 10.2.6 finding under the same advisory", () => {
        const result = classifyAuditResult({
            stdout: report({ 1244012: auditRecord({ version: "10.2.6", findingPath: ".>eslint>minimatch" }) }),
            exitCode: 1,
        })

        assert.equal(result.status, "fail")
    })

    it("rejects a different advisory affecting a v3 release", () => {
        const result = classifyAuditResult({
            stdout: report({ 555: auditRecord({ advisory: "GHSA-new-v3-advisory" }) }),
            exitCode: 1,
        })

        assert.equal(result.status, "fail")
    })

    it("rejects mixed known and unknown findings", () => {
        const result = classifyAuditResult({
            stdout: report({
                1244012: auditRecord({}),
                555: auditRecord({ advisory: "GHSA-new-v3-advisory", packageName: "other-package" }),
            }),
            exitCode: 1,
        })

        assert.equal(result.status, "fail")
    })

    it("rejects malformed JSON", () => {
        const result = classifyAuditResult({ stdout: "not-json", exitCode: 1 })
        assert.equal(result.status, "fail")
        assert.match(result.message, /malformed JSON/)
    })

    it("fails closed on command errors and unexpected exit codes", () => {
        assert.equal(classifyAuditResult({ stdout: "", exitCode: null, error: "ENOENT" }).status, "fail")
        assert.equal(classifyAuditResult({ stdout: "{}", exitCode: 2 }).status, "fail")
        assert.equal(classifyAuditResult({ stdout: JSON.stringify({ error: "registry unavailable" }), exitCode: 1 }).status, "fail")
    })

    it("rejects unexpected package version or dependency path", () => {
        const wrongVersion = classifyAuditResult({
            stdout: report({ 1244012: auditRecord({ version: "3.1.4" }) }),
            exitCode: 1,
        })
        const wrongPath = classifyAuditResult({
            stdout: report({ 1244012: auditRecord({ findingPath: ".>unreviewed-parent>minimatch" }) }),
            exitCode: 1,
        })

        assert.equal(wrongVersion.status, "fail")
        assert.equal(wrongPath.status, "fail")
    })
})
