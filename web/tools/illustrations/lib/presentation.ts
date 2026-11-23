import {
    cloneElement,
    isValidElement,
    type CSSProperties,
    type ReactElement,
    type ReactNode,
} from 'react'
import { Canvas, Scene, TitleBar } from 'vizmatic'

interface FigureProps {
    children?: ReactNode
    style?: CSSProperties
    background?: string
    title?: string
    subtitle?: string
}

/** Keep article figures flat and transparent without changing their geometry. */
export function prepareArticleFigure(
    element: unknown,
    opaqueBackground: boolean,
    stripTitles = true,
): ReactNode {
    function visit(node: ReactNode, root: boolean): ReactNode {
        if (Array.isArray(node)) return node.map((child) => visit(child, root))
        const reactElement = isValidElement(node)
        // Legacy figures also use Satori element objects without React's marker.
        if (
            !reactElement &&
            !(node && typeof node === 'object' && 'type' in node && 'props' in node)
        )
            return node
        const el = node as ReactElement<FigureProps>

        if (el.type === Scene) {
            const props = stripTitles
                ? { ...el.props, title: undefined, subtitle: undefined }
                : el.props
            return visit(Scene(props as Parameters<typeof Scene>[0]), root)
        }
        if (el.type === Canvas) {
            return visit(
                Canvas({
                    ...el.props,
                    ...(!opaqueBackground ? { background: 'transparent' } : {}),
                } as Parameters<typeof Canvas>[0]),
                root,
            )
        }
        // Static illustration components are pure functions, including animation
        // frames. Expand them so wrapped scenes receive the same presentation.
        if (typeof el.type === 'function') {
            return visit((el.type as (props: FigureProps) => ReactNode)(el.props), root)
        }

        const style = { ...el.props.style }
        delete style.boxShadow
        const rawChildren = Array.isArray(el.props.children)
            ? el.props.children
            : [el.props.children]
        const children = rawChildren
            .filter(
                (child) =>
                    !(
                        root &&
                        stripTitles &&
                        isValidElement(child) &&
                        (child.type === TitleBar ||
                            (typeof child.type === 'function' && child.type.name === 'TitleBar'))
                    ),
            )
            .map((child, index) => {
                const rendered = visit(child, false)
                return isValidElement(rendered) && rendered.key === null
                    ? cloneElement(rendered, { key: index })
                    : rendered
            })
        const overrides = {
            style,
            ...(el.props.children !== undefined
                ? { children: children.length === 1 ? children[0] : children }
                : {}),
        }
        return reactElement
            ? cloneElement(el, overrides)
            : { ...el, props: { ...el.props, ...overrides } }
    }

    return visit(element as ReactNode, true)
}
