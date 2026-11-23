// @vitest-environment node

import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"

type AstNode = {
    type: string
    value?: string
    nodes?: AstNode[]
    commas?: number
    ranges?: number
}

type BracesApi = {
    (input: string, options?: { expand?: boolean }): string[]
    compile(input: AstNode, options?: { maxDepth?: number }): string
    expand(input: AstNode, options?: { maxDepth?: number }): string[]
    stringify(input: AstNode, options?: { maxDepth?: number }): string
}

const configNextRequire = createRequire(import.meta.url)
const nextPluginRequire = createRequire(configNextRequire.resolve("@next/eslint-plugin-next"))
const fastGlobRequire = createRequire(nextPluginRequire.resolve("fast-glob"))
const micromatchRequire = createRequire(fastGlobRequire.resolve("micromatch"))
const braces = micromatchRequire("braces") as BracesApi

const nestedAst = (depth: number): AstNode => {
    let node: AstNode = { type: "text", value: "leaf" }
    for (let index = 0; index < depth; index += 1) {
        node = { type: "brace", nodes: [node], commas: 0, ranges: 0 }
    }
    return { type: "root", nodes: [node] }
}

describe("transitive braces depth limits", () => {
    it("rejects deeply nested input before recursive processing exhausts the stack", () => {
        const pattern = "{".repeat(5000) + "}".repeat(5000)

        expect(() => braces(pattern)).toThrow(/Input depth \(101\), exceeds max depth \(100\)/)
    })

    it("keeps ordinary brace compilation and expansion working", () => {
        expect(braces("src/{components,lib}")).toEqual(["src/(components|lib)"])
        expect(braces("{a,b}", { expand: true })).toEqual(["a", "b"])
    })

    it.each([
        ["compile", (ast: AstNode) => braces.compile(ast)],
        ["expand", (ast: AstNode) => braces.expand(ast)],
        ["stringify", (ast: AstNode) => braces.stringify(ast)],
    ])("rejects a deeply nested AST passed directly to %s", (_name, run) => {
        expect(() => run(nestedAst(101))).toThrow(/AST depth \(101\), exceeds max depth \(100\)/)
    })
})
