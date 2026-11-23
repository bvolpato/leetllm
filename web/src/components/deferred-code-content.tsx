"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

type SyntaxModule = typeof import("./content-syntax-highlighter")

type DeferredCodeContentProps = {
    code: string
    language: string | null
    label: string
    isDark: boolean
    className: string
    style: CSSProperties
    codeStyle?: CSSProperties
    lineNumberStyle?: CSSProperties
    lineNumberClassName?: string
    showLineNumbers?: boolean
    printAware?: boolean
}

let syntaxModulePromise: Promise<SyntaxModule> | undefined

function loadSyntaxModule() {
    syntaxModulePromise ??= import("./content-syntax-highlighter").catch((error: unknown) => {
        syntaxModulePromise = undefined
        throw error
    })
    return syntaxModulePromise
}

/** Render complete plain code first, then tokenize only after it nears the viewport. */
export function DeferredCodeContent({
    code,
    language,
    label,
    isDark,
    className,
    style,
    codeStyle,
    lineNumberStyle,
    lineNumberClassName,
    showLineNumbers = false,
    printAware = false,
}: DeferredCodeContentProps) {
    const targetRef = useRef<HTMLDivElement | null>(null)
    const [syntaxModule, setSyntaxModule] = useState<SyntaxModule | null>(null)

    useEffect(() => {
        const target = targetRef.current
        if (!language || !target) return

        let active = true
        const load = () => {
            void loadSyntaxModule()
                .then((module) => {
                    if (active) setSyntaxModule(module)
                })
                .catch(() => {
                    // The complete plain-text block remains usable if the optional grammar chunk fails.
                })
        }

        if (typeof IntersectionObserver === "undefined") {
            load()
            return () => {
                active = false
            }
        }

        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.target === target && entry.isIntersecting)) return
            observer.disconnect()
            load()
        }, { rootMargin: "200px" })

        observer.observe(target)
        return () => {
            active = false
            observer.disconnect()
        }
    }, [language])

    return (
        <div
            ref={targetRef}
            tabIndex={0}
            role="region"
            aria-label={`${label} code block`}
            className={className}
            style={style}
            data-code-region
        >
            {language && syntaxModule ? (
                <syntaxModule.SyntaxHighlighter
                    style={printAware
                        ? syntaxModule.printAwareSyntaxTheme
                        : isDark
                            ? syntaxModule.oneDark
                            : syntaxModule.oneLight}
                    language={language}
                    PreTag="div"
                    showLineNumbers={showLineNumbers}
                    lineNumberStyle={lineNumberStyle}
                    customStyle={{
                        margin: 0,
                        padding: 0,
                        borderRadius: 0,
                        background: "transparent",
                        color: "inherit",
                        fontFamily: "inherit",
                        lineHeight: "inherit",
                        overflow: "visible",
                        textShadow: "none",
                    }}
                    codeTagProps={{ style: { ...codeStyle, background: "transparent" } }}
                >
                    {code}
                </syntaxModule.SyntaxHighlighter>
            ) : (
                <div
                    className={showLineNumbers ? "grid min-w-full grid-cols-[auto_minmax(0,1fr)] max-[640px]:grid-cols-[0_minmax(0,1fr)]" : "min-w-full"}
                    style={{ width: "100%" }}
                >
                    {showLineNumbers && (
                        <span
                            aria-hidden="true"
                            className={`linenumber select-none text-right text-[0.8rem] ${lineNumberClassName ?? ""}`.trim()}
                            style={{
                                ...lineNumberStyle,
                                fontSize: undefined,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                paddingRight: lineNumberStyle?.paddingRight ?? "1em",
                            }}
                        >
                            {code.split("\n").map((_, index) => (
                                <span key={index} style={{ display: "block", lineHeight: "inherit" }}>
                                    {index + 1}
                                </span>
                            ))}
                        </span>
                    )}
                    <pre
                        className="m-0 min-w-0 overflow-visible whitespace-pre"
                        data-code-plain
                        style={{
                            padding: 0,
                            background: "transparent",
                            color: "inherit",
                            fontFamily: "inherit",
                            lineHeight: "inherit",
                            textShadow: "none",
                            ...codeStyle,
                        }}
                    >
                        <code style={{ ...codeStyle, background: "transparent" }}>{code}</code>
                    </pre>
                </div>
            )}
        </div>
    )
}
