/**
 * Next.js instrumentation — logs server-side errors to stderr so that
 * Cloud Logging can capture them.
 *
 * Without this, SSR errors result in a 500 response but the actual
 * error message/stack trace is never written to stdout/stderr, making
 * production debugging impossible.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function onRequestError(
    err: { digest: string } & Error,
    request: {
        path: string
        method: string
        headers: { [key: string]: string | string[] }
    },
    context: {
        routerKind: 'Pages Router' | 'App Router'
        routePath: string
        routeType: 'render' | 'route' | 'action' | 'proxy'
        renderSource?: string
        revalidateReason?: string
        renderType?: string
    }
) {
    console.error('[SSR_ERROR]', JSON.stringify({
        message: err.message,
        digest: err.digest,
        stack: err.stack,
        path: request.path,
        method: request.method,
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
        renderSource: context.renderSource,
    }))
}
