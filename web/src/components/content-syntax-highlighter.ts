import type { CSSProperties } from "react"
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light"
import baseOneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark"
import baseOneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light"
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp"
import css from "react-syntax-highlighter/dist/esm/languages/prism/css"
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff"
import django from "react-syntax-highlighter/dist/esm/languages/prism/django"
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker"
import http from "react-syntax-highlighter/dist/esm/languages/prism/http"
import ignore from "react-syntax-highlighter/dist/esm/languages/prism/ignore"
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript"
import json from "react-syntax-highlighter/dist/esm/languages/prism/json"
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup"
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown"
import protobuf from "react-syntax-highlighter/dist/esm/languages/prism/protobuf"
import promql from "react-syntax-highlighter/dist/esm/languages/prism/promql"
import python from "react-syntax-highlighter/dist/esm/languages/prism/python"
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql"
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml"
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx"
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import { resolvePrismLanguage, isSupportedPrismLanguage } from "./prism-language"

const languages = {
    bash,
    cpp,
    css,
    diff,
    django,
    docker,
    http,
    ignore,
    javascript,
    json,
    markdown,
    markup,
    protobuf,
    promql,
    python,
    sql,
    toml,
    tsx,
    typescript,
    yaml,
} as const

for (const [name, grammar] of Object.entries(languages)) {
    SyntaxHighlighter.registerLanguage(name, grammar)
}

SyntaxHighlighter.alias("docker", "dockerfile")
SyntaxHighlighter.alias("ignore", "gitignore")
SyntaxHighlighter.alias("markup", "html")

export { isSupportedPrismLanguage, resolvePrismLanguage }

export const oneDark = {
    ...baseOneDark,
    comment: { ...baseOneDark.comment, color: "#cbd5e1" },
} as typeof baseOneDark & Record<string, CSSProperties>

export const oneLight = {
    ...baseOneLight,
    comment: { ...baseOneLight.comment, color: "#4b5563" },
} as typeof baseOneLight & Record<string, CSSProperties>

const ADAPTIVE_SYNTAX_COLOR_PROPERTIES = [
    "background",
    "backgroundColor",
    "borderBottomColor",
    "borderColor",
    "borderRightColor",
    "borderTopColor",
    "color",
    "fill",
    "stroke",
] as const

function createPrintAwareSyntaxTheme(): Record<string, CSSProperties> {
    const darkTheme = oneDark as Record<string, CSSProperties>
    const lightTheme = oneLight as Record<string, CSSProperties>
    const selectors = new Set([...Object.keys(darkTheme), ...Object.keys(lightTheme)])

    return Object.fromEntries(Array.from(selectors, (selector) => {
        const darkRule = darkTheme[selector] ?? {}
        const lightRule = lightTheme[selector] ?? {}
        const rule = { ...darkRule, ...lightRule } as CSSProperties & Record<string, unknown>

        for (const property of ADAPTIVE_SYNTAX_COLOR_PROPERTIES) {
            const darkValue = darkRule[property]
            const lightValue = lightRule[property]
            if (typeof darkValue === "string" && typeof lightValue === "string" && darkValue !== lightValue) {
                rule[property] = `light-dark(${lightValue}, ${darkValue})`
            }
        }

        rule.textShadow = "none"
        return [selector, rule]
    }))
}

export const printAwareSyntaxTheme = createPrintAwareSyntaxTheme()

export { SyntaxHighlighter }
