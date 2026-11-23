import type { HTMLAttributes } from "react"
import { GlossaryTerm } from "./glossary-term"

export function GlossaryMarkdownSpan(
    props: HTMLAttributes<HTMLSpanElement> & { node?: unknown },
) {
    const glossaryId = (props as HTMLAttributes<HTMLSpanElement> & { "data-glossary"?: unknown })["data-glossary"]
    if (typeof glossaryId === "string") {
        return <GlossaryTerm id={glossaryId}>{props.children}</GlossaryTerm>
    }

    const { node, ...rest } = props
    void node
    return <span {...rest} />
}
