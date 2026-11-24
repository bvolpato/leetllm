"use client"

import { useMemo } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { indentWithTab } from "@codemirror/commands"
import { java as javaLanguage } from "@codemirror/lang-java"
import { python } from "@codemirror/lang-python"
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language"
import { EditorState, RangeSetBuilder, type Extension } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView, keymap, ViewPlugin, type ViewUpdate } from "@codemirror/view"
import { tags } from "@lezer/highlight"
import type { PracticeLanguage } from "@/lib/practice-languages"

const lightEditorHighlight = HighlightStyle.define([
    { tag: tags.keyword, color: "#cf222e", fontWeight: "600" },
    { tag: [tags.string, tags.special(tags.string)], color: "#0a3069" },
    { tag: [tags.number, tags.bool, tags.null], color: "#0550ae" },
    { tag: [tags.function(tags.variableName), tags.definition(tags.function(tags.variableName))], color: "#8250df" },
    { tag: [tags.className, tags.definition(tags.className)], color: "#953800", fontWeight: "600" },
    { tag: [tags.variableName, tags.propertyName], color: "#24292f" },
    { tag: [tags.comment, tags.docComment], color: "#6e7781", fontStyle: "italic" },
    { tag: tags.operator, color: "#0550ae" },
])

const darkEditorHighlight = HighlightStyle.define([
    { tag: tags.keyword, color: "#ff7b72", fontWeight: "600" },
    { tag: [tags.string, tags.special(tags.string)], color: "#a5d6ff" },
    { tag: [tags.number, tags.bool, tags.null], color: "#79c0ff" },
    { tag: [tags.function(tags.variableName), tags.definition(tags.function(tags.variableName))], color: "#d2a8ff" },
    { tag: [tags.className, tags.definition(tags.className)], color: "#ffa657", fontWeight: "600" },
    { tag: [tags.variableName, tags.propertyName], color: "#e6edf3" },
    { tag: [tags.comment, tags.docComment], color: "#8b949e", fontStyle: "italic" },
    { tag: tags.operator, color: "#79c0ff" },
])

const lightEditorTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "#ffffff",
        color: "#24292f",
    },
    ".cm-scroller": {
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "0.875rem",
        lineHeight: "1.5rem",
    },
    ".cm-content": {
        minHeight: "100%",
        padding: "1rem 0",
        caretColor: "#7c3aed",
        fontVariantLigatures: "none",
        fontFeatureSettings: "\"liga\" 0, \"calt\" 0",
    },
    ".cm-line": {
        padding: "0 1rem",
    },
    ".cm-gutters": {
        backgroundColor: "#f6f8fa",
        color: "#6e7781",
        borderRight: "1px solid #d0d7de",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#eef2ff",
        color: "#4f46e5",
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(15, 23, 42, 0.035)",
    },
    ".cm-selectionLayer .cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
        backgroundColor: "#facc15a6",
    },
    ".cm-content ::selection, .cm-content *::selection": {
        backgroundColor: "#facc15",
        color: "#111827",
        WebkitTextFillColor: "#111827",
    },
    ".cm-visible-space, .cm-visible-tab": {
        position: "relative",
    },
    ".cm-visible-space::after, .cm-visible-tab::after": {
        position: "absolute",
        inset: "0",
        color: "#57606a",
        opacity: "0.45",
        pointerEvents: "none",
        textAlign: "center",
    },
    ".cm-visible-space::after": {
        content: "\"·\"",
    },
    ".cm-visible-tab::after": {
        content: "\"→\"",
        textAlign: "left",
    },
    "&.cm-focused": {
        outline: "none",
    },
    ".cm-cursor": {
        borderLeftColor: "#7c3aed",
    },
    ".cm-matchingBracket": {
        backgroundColor: "#dcfce7",
        outline: "1px solid #86efac",
    },
    ".cm-tooltip": {
        border: "1px solid #d0d7de",
        backgroundColor: "#ffffff",
        color: "#24292f",
    },
}, { dark: false })

const darkEditorTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "#0d1117",
        color: "#e6edf3",
    },
    ".cm-scroller": {
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "0.875rem",
        lineHeight: "1.5rem",
    },
    ".cm-content": {
        minHeight: "100%",
        padding: "1rem 0",
        caretColor: "#c4b5fd",
        fontVariantLigatures: "none",
        fontFeatureSettings: "\"liga\" 0, \"calt\" 0",
    },
    ".cm-line": {
        padding: "0 1rem",
    },
    ".cm-gutters": {
        backgroundColor: "#111827",
        color: "#8b949e",
        borderRight: "1px solid #30363d",
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#1f2937",
        color: "#c4b5fd",
    },
    ".cm-activeLine": {
        backgroundColor: "#161b22",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "#8b5cf680",
        color: "#ffffff",
    },
    ".cm-visible-space, .cm-visible-tab": {
        position: "relative",
    },
    ".cm-visible-space::after, .cm-visible-tab::after": {
        position: "absolute",
        inset: "0",
        color: "#8b949e",
        opacity: "0.5",
        pointerEvents: "none",
        textAlign: "center",
    },
    ".cm-visible-space::after": {
        content: "\"·\"",
    },
    ".cm-visible-tab::after": {
        content: "\"→\"",
        textAlign: "left",
    },
    "&.cm-focused": {
        outline: "none",
    },
    ".cm-cursor": {
        borderLeftColor: "#c4b5fd",
    },
    ".cm-matchingBracket": {
        backgroundColor: "#1f3a2d",
        outline: "1px solid #238636",
    },
    ".cm-tooltip": {
        border: "1px solid #30363d",
        backgroundColor: "#161b22",
        color: "#e6edf3",
    },
}, { dark: true })

function buildWhitespaceDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>()

    for (const { from, to } of view.visibleRanges) {
        let position = from
        while (position <= to) {
            const line = view.state.doc.lineAt(position)
            const lineStart = Math.max(from, line.from)
            const lineEnd = Math.min(to, line.to)
            const text = view.state.sliceDoc(lineStart, lineEnd)

            for (let index = 0; index < text.length; index += 1) {
                const char = text[index]
                if (char === " ") {
                    builder.add(lineStart + index, lineStart + index + 1, Decoration.mark({ class: "cm-visible-space" }))
                } else if (char === "\t") {
                    builder.add(lineStart + index, lineStart + index + 1, Decoration.mark({ class: "cm-visible-tab" }))
                }
            }

            position = line.to + 1
        }
    }

    return builder.finish()
}

const whitespaceMarkers = ViewPlugin.fromClass(class {
    decorations: DecorationSet

    constructor(view: EditorView) {
        this.decorations = buildWhitespaceDecorations(view)
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = buildWhitespaceDecorations(update.view)
        }
    }
}, {
    decorations: (value) => value.decorations,
})

function codeEditorExtensions(language: PracticeLanguage, label: string, isLightTheme: boolean): Extension[] {
    return [
        language === "java" ? javaLanguage() : python(),
        EditorState.tabSize.of(4),
        indentUnit.of("    "),
        keymap.of([indentWithTab]),
        EditorView.contentAttributes.of({
            "aria-label": label,
            autocapitalize: "off",
            autocomplete: "off",
            autocorrect: "off",
            spellcheck: "false",
        }),
        isLightTheme ? lightEditorTheme : darkEditorTheme,
        syntaxHighlighting(isLightTheme ? lightEditorHighlight : darkEditorHighlight),
        whitespaceMarkers,
    ]
}

export interface PracticeCodeEditorProps {
    value: string
    onChange: (value: string) => void
    language: PracticeLanguage
    label: string
    isLightTheme: boolean
}

export function PracticeCodeEditor({
    value,
    onChange,
    language,
    label,
    isLightTheme,
}: PracticeCodeEditorProps) {
    const extensions = useMemo<Extension[]>(
        () => codeEditorExtensions(language, label, isLightTheme),
        [isLightTheme, label, language],
    )

    return (
        <CodeMirror
            aria-label={label}
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme="none"
            indentWithTab={false}
            basicSetup
            height="100%"
            width="100%"
            className="h-full"
        />
    )
}
