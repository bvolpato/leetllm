/**
 * Make a Satori SVG print as true vector art.
 *
 * Satori wraps elements in luminance masks and embeds nested SVG as images. Both
 * are correct on screen, but Chromium's PDF backend turns each one into a small
 * bitmap, so "vector" figures come out as a mosaic. Here nested images become
 * inline SVG, and masks that only cut to a shape become clip paths, which PDF
 * can represent directly.
 */
const DATA_SVG =
    /<image\b([^>]*?)href="data:image\/svg\+xml;(?:utf8|charset=utf-8),([^"]*)"([^>]*?)\/?>(?:<\/image>)?/g
const SIMPLE_MASK =
    /<mask id="([^"]+)"[^>]*>\s*<(rect|path|circle|ellipse)\b([^>]*?)\/>\s*<\/mask>/g

function attribute(attributes: string, name: string): string | undefined {
    return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes)?.[1]
}

function inlineNestedSvg(svg: string): string {
    let previous: string
    let output = svg
    // Nested images can hold further nested images.
    do {
        previous = output
        output = output.replace(
            DATA_SVG,
            (match, before: string, encoded: string, after: string) => {
                let inner: string
                try {
                    inner = decodeURIComponent(encoded)
                } catch {
                    return match
                }
                if (!inner.trimStart().startsWith('<svg')) return match
                const attributes = `${before} ${after}`
                const placed = ['x', 'y', 'width', 'height']
                    .map((name) => [name, attribute(attributes, name)] as const)
                    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined)
                const style = attribute(attributes, 'style')
                const clip = attribute(attributes, 'clip-path')
                const mask = attribute(attributes, 'mask')
                const opacity = attribute(attributes, 'opacity')
                const body = inner.replace(
                    /^\s*<svg\b([^>]*)>/,
                    (_open, rootAttributes: string) => {
                        const kept = rootAttributes.replace(
                            /\s(?:xmlns|x|y|width|height)="[^"]*"/g,
                            '',
                        )
                        return `<svg${kept} ${placed.map(([name, value]) => `${name}="${value}"`).join(' ')}>`
                    },
                )
                const wrappers = [
                    clip ? `clip-path="${clip}"` : '',
                    mask ? `mask="${mask}"` : '',
                    opacity ? `opacity="${opacity}"` : '',
                    style ? `style="${style}"` : '',
                ]
                    .filter(Boolean)
                    .join(' ')
                return wrappers ? `<g ${wrappers}>${body}</g>` : body
            },
        )
    } while (output !== previous)
    return output
}

function coversCanvas(shape: string, tag: string, width: number, height: number): boolean {
    if (tag !== 'rect' || attribute(shape, 'rx') || attribute(shape, 'ry')) return false
    const number = (name: string) => Number(attribute(shape, name) ?? 0)
    return (
        number('x') <= 0 &&
        number('y') <= 0 &&
        number('x') + number('width') >= width &&
        number('y') + number('height') >= height
    )
}

/** Replace masks that only cut to one opaque shape. Others stay, because they may blend. */
function masksToClips(svg: string, width: number, height: number): string {
    const removed = new Set<string>()
    const clips = new Set<string>()
    let output = svg.replace(SIMPLE_MASK, (match, id: string, tag: string, attributes: string) => {
        const fill = attribute(attributes, 'fill')
        if (fill !== undefined && !/^(?:#fff(?:fff)?|white)$/i.test(fill)) return match
        if (attribute(attributes, 'fill-opacity') || attribute(attributes, 'opacity')) return match
        if (coversCanvas(attributes, tag, width, height)) {
            removed.add(id)
            return ''
        }
        clips.add(id)
        const shape = attributes
            .replace(/\sfill="[^"]*"/, '')
            .replace(/\smask="url\(#([^)]+)\)"/, ' clip-path="url(#$1)"')
        return `<clipPath id="${id}"><${tag}${shape}/></clipPath>`
    })
    // An element can carry both a clip and a mask, and an attribute can appear only
    // once. A clip path may itself be clipped, so combine the two in a new definition.
    const combined = new Map<string, string>()
    output = output.replace(/<([a-zA-Z]+)\b([^<>]*)>/g, (tag, name: string, attributes: string) => {
        const mask = /\smask="url\(#([^)]+)\)"/.exec(attributes)?.[1]
        if (mask === undefined) return tag
        if (removed.has(mask)) return `<${name}${attributes.replace(/\smask="[^"]*"/, '')}>`
        if (!clips.has(mask)) return tag
        const clip = /\sclip-path="url\(#([^)]+)\)"/.exec(attributes)?.[1]
        if (clip === undefined || removed.has(clip)) {
            return `<${name}${attributes.replace(/\sclip-path="[^"]*"/, '').replace(/\smask="[^"]*"/, ` clip-path="url(#${mask})"`)}>`
        }
        const id = `${mask}__${clip}`
        combined.set(
            id,
            `<clipPath id="${id}" clip-path="url(#${clip})"><use href="#${mask}__shape"/></clipPath>`,
        )
        return `<${name}${attributes.replace(/\sclip-path="[^"]*"/, '').replace(/\smask="[^"]*"/, ` clip-path="url(#${id})"`)}>`
    })
    // A shape inside a clip path can refer to a mask that was just removed.
    output = output.replace(/\sclip-path="url\(#([^)]+)\)"/g, (match, id: string) =>
        removed.has(id) ? '' : match,
    )
    if (combined.size === 0) return output
    // Combined clips reuse each mask's shape, so give those shapes an id they can refer to.
    const shapes = new Set(Array.from(combined.keys(), (id) => id.split('__')[0]))
    output = output.replace(
        /<clipPath id="([^"]+)"><(rect|path|circle|ellipse)\b/g,
        (match, id: string, tag: string) =>
            shapes.has(id) ? `<clipPath id="${id}"><${tag} id="${id}__shape"` : match,
    )
    return output.replace(/<\/svg>\s*$/, `${[...combined.values()].join('')}</svg>`)
}

export function prepareSvgForPrint(svg: string, width: number, height: number): string {
    return masksToClips(inlineNestedSvg(svg), width, height)
}
