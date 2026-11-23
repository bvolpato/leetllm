import {
    cloneElement,
    isValidElement,
    type CSSProperties,
    type ReactElement,
    type ReactNode,
} from 'react'

// The text block of the 7.5 by 9.25 inch trim, in points. See tools/book/styles.ts.
export const BOOK_FIGURE_WIDTH_PT = 406.8
export const BOOK_FIGURE_HEIGHT_PT = 465
export const BOOK_LABEL_TARGET_PT = 8.5
/** Size that ordinary figure labels print at, a little smaller than the 10.5 pt body. */
export const BOOK_BODY_LABEL_PT = 8.75
/** Nothing except subscripts and superscripts prints smaller than this. */
export const BOOK_SMALLEST_LABEL_PT = 8

export function printedFigureScale(width: number, height: number): number {
    return Math.min(1.5, BOOK_FIGURE_WIDTH_PT / width, BOOK_FIGURE_HEIGHT_PT / height)
}

export interface FigureLabelStats {
    /** The font size most of the figure's text uses, in canvas pixels. */
    dominantPx?: number
    /** The smallest size used by more than a stray script character. */
    smallestPx?: number
}

type LabelContent = string | number | boolean | null

// Satori preserves numeric and conditional React children in its layout callback.
function labelText(textContent: LabelContent | undefined): string {
    if (typeof textContent === 'boolean') return ''
    return typeof textContent === 'number' ? String(textContent) : (textContent?.trim() ?? '')
}

/** Read label sizes from a rendered layout, weighted by how much text uses each size. */
export function figureLabelStats(
    nodes: ReadonlyArray<{
        textContent?: LabelContent
        props?: Record<string, unknown>
    }>,
): FigureLabelStats {
    const sizes: Array<{ px: number; characters: number }> = []
    for (const node of nodes) {
        const text = labelText(node.textContent)
        const px = (node.props?.style as CSSProperties | undefined)?.fontSize
        if (!text || typeof px !== 'number' || px <= 0) continue
        sizes.push({ px, characters: text.length })
    }
    if (sizes.length === 0) return {}
    sizes.sort((a, b) => a.px - b.px)
    const total = sizes.reduce((sum, size) => sum + size.characters, 0)
    let seen = 0
    let dominantPx = sizes[sizes.length - 1].px
    for (const size of sizes) {
        seen += size.characters
        if (seen >= total / 2) {
            dominantPx = size.px
            break
        }
    }
    return { dominantPx, smallestPx: sizes.find((size) => size.characters > 2)?.px ?? sizes[0].px }
}

/**
 * Print scale in points per canvas pixel. Figures were drawn on canvases of many
 * sizes, so stretching each one to the column width makes labels vary widely.
 * This scale prints ordinary labels at one size across the book, within the limits of the page.
 */
export function bookDisplayScale(width: number, height: number, stats: FigureLabelStats): number {
    const largest = Math.min(BOOK_FIGURE_WIDTH_PT / width, BOOK_FIGURE_HEIGHT_PT / height)
    if (!stats.dominantPx) return Math.min(largest, 0.75)
    const forBody = BOOK_BODY_LABEL_PT / stats.dominantPx
    const forSmallest = stats.smallestPx ? BOOK_SMALLEST_LABEL_PT / stats.smallestPx : 0
    return Math.min(largest, Math.max(forBody, forSmallest))
}

interface TextProps {
    children?: ReactNode
    style?: CSSProperties
    fontSize?: number | string
}

function pixels(value: number | string | undefined, inherited: number): number {
    if (typeof value === 'number') return value
    if (typeof value !== 'string') return inherited
    const match = /^([\d.]+)(px|pt|em|rem|%)?$/.exec(value)
    if (!match) return inherited
    const amount = Number(match[1])
    if (match[2] === 'pt') return (amount * 4) / 3
    if (match[2] === 'em') return amount * inherited
    if (match[2] === 'rem') return amount * 16
    if (match[2] === '%') return (amount * inherited) / 100
    return amount
}

export interface LayoutNode {
    left: number
    top: number
    width: number
    height: number
    textContent?: LabelContent
    props?: Record<string, unknown>
}

function boxed(style: CSSProperties | undefined): boolean {
    if (!style) return false
    const border = style.border ?? style.borderWidth ?? style.borderTop
    return (
        typeof style.height === 'number' &&
        Boolean(border || style.backgroundColor || style.background)
    )
}

/**
 * Find text that lands on other text or spills out of its box. Raising small labels
 * keeps hand-placed positions, so a label can grow into its neighbor. Satori reports
 * no error for that, and only the layout shows it. Returns one note per collision.
 */
export function textCollisions(nodes: ReadonlyArray<LayoutNode>): string[] {
    const texts = nodes.filter(
        (node) => labelText(node.textContent) && node.width > 0 && node.height > 0,
    )
    // A text node can be wider than its glyphs, and a flex parent can center them without the node
    // saying so. So estimate each place the ink can fall, and report only overlaps that hold for all.
    const inkSpans = (node: LayoutNode): Array<[number, number]> => {
        const style = node.props?.style as CSSProperties | undefined
        const px = typeof style?.fontSize === 'number' ? style.fontSize : node.height * 0.8
        const perCharacter = /mono/i.test(String(style?.fontFamily ?? '')) ? 0.6 : 0.5
        const width = Math.min(node.width, labelText(node.textContent).length * px * perCharacter)
        const slack = node.width - width
        const starts =
            style?.textAlign === 'center'
                ? [slack / 2]
                : style?.textAlign === 'right'
                  ? [slack]
                  : style?.textAlign
                    ? [0]
                    : [0, slack / 2, slack]
        return starts.map((start) => [node.left + start, node.left + start + width])
    }
    const collisions: string[] = []
    // Fixed-height text does not report its wrapped lines, which then fall on whatever is below.
    for (const node of texts) {
        const style = node.props?.style as CSSProperties | undefined
        const text = labelText(node.textContent)
        if (
            typeof style?.fontSize !== 'number' ||
            style.whiteSpace === 'nowrap' ||
            !/[\s-]/.test(text)
        )
            continue
        // Monospace widths are exact. Proportional text needs a margin, since this is only an estimate.
        const mono = /mono/i.test(String(style.fontFamily ?? ''))
        const lines = Math.ceil(
            (text.length * style.fontSize * (mono ? 0.6 : 0.5)) /
                (mono ? node.width : node.width * 1.2),
        )
        if (lines > 1 && lines * style.fontSize * 1.1 > node.height + 2)
            collisions.push(`"${text}" wraps out of its line`)
    }
    for (let a = 0; a < texts.length; a++) {
        for (let b = a + 1; b < texts.length; b++) {
            const first = texts[a],
                second = texts[b]
            const overlapY =
                Math.min(first.top + first.height, second.top + second.height) -
                Math.max(first.top, second.top)
            if (overlapY <= 0) continue
            const spans = inkSpans(second)
            const touches = inkSpans(first).every(([left, right]) =>
                spans.every(
                    ([otherLeft, otherRight]) =>
                        Math.min(right, otherRight) - Math.max(left, otherLeft) > 1,
                ),
            )
            if (!touches) continue
            // Line boxes carry spare leading, so ignore grazing overlaps.
            const smaller = Math.min(first.height, second.height)
            if (overlapY >= smaller * 0.3)
                collisions.push(`"${first.textContent}" on "${second.textContent}"`)
        }
    }
    const boxes = nodes.filter((node) => boxed(node.props?.style as CSSProperties | undefined))
    for (const text of texts) {
        for (const box of boxes) {
            const inside =
                text.left >= box.left - 1 &&
                text.left + text.width <= box.left + box.width + 1 &&
                text.top >= box.top - 1 &&
                text.top < box.top + box.height
            if (inside && text.top + text.height > box.top + box.height + 3) {
                collisions.push(`"${text.textContent}" spills out of its box`)
                break
            }
        }
    }
    return collisions
}

export function minimumBookLabelPixels(
    width: number,
    height: number,
    targetPt = BOOK_LABEL_TARGET_PT,
): number {
    return Math.ceil(targetPt / printedFigureScale(width, height))
}

/** Print type has a physical minimum; bitmap sampling cannot make small labels readable. */
export function preparePrintTypography(element: ReactNode, minimumPixels: number): ReactNode {
    function visit(node: ReactNode, inherited: number, printedParent: number): ReactNode {
        if (Array.isArray(node)) return node.map((child) => visit(child, inherited, printedParent))
        const reactElement = isValidElement(node)
        if (
            !reactElement &&
            !(node && typeof node === 'object' && 'type' in node && 'props' in node)
        )
            return node
        const el = node as ReactElement<TextProps>
        const style: CSSProperties = { ...el.props.style }
        const font = pixels(style.fontSize ?? el.props.fontSize, inherited)
        const script =
            el.type === 'sub' ||
            el.type === 'sup' ||
            style.verticalAlign === 'sub' ||
            style.verticalAlign === 'super'
        const printed = script ? (font * printedParent) / inherited : Math.max(font, minimumPixels)
        style.fontSize = printed
        if (typeof style.lineHeight === 'string' && style.lineHeight.endsWith('px')) {
            style.lineHeight = `${Math.max(Number.parseFloat(style.lineHeight), printed * 1.15)}px`
        }
        const overrides = {
            style,
            ...(el.props.children !== undefined
                ? { children: visit(el.props.children, font, printed) }
                : {}),
        }
        return reactElement
            ? cloneElement(el, overrides)
            : { ...el, props: { ...el.props, ...overrides } }
    }

    return visit(element, 16, 16)
}
