import { vi } from "vitest"

export function installControlledIntersectionObserver() {
    const observers: Array<{
        rootMargin: string
        targets: Element[]
        disconnect: ReturnType<typeof vi.fn>
        enter(isIntersecting?: boolean): void
    }> = []

    class ControlledIntersectionObserver {
        readonly rootMargin: string
        readonly targets: Element[] = []
        readonly disconnect = vi.fn()

        constructor(
            private readonly callback: IntersectionObserverCallback,
            options?: IntersectionObserverInit,
        ) {
            this.rootMargin = options?.rootMargin ?? "0px"
            observers.push(this)
        }

        observe(target: Element) {
            this.targets.push(target)
        }

        unobserve() {}
        takeRecords(): IntersectionObserverEntry[] { return [] }

        enter(isIntersecting = true) {
            const entries = this.targets.map((target) => ({
                target,
                isIntersecting,
                intersectionRatio: isIntersecting ? 1 : 0,
            } as IntersectionObserverEntry))
            this.callback(entries, this as unknown as IntersectionObserver)
        }
    }

    vi.stubGlobal("IntersectionObserver", ControlledIntersectionObserver)

    return {
        observers,
        enterAll(isIntersecting = true) {
            for (const observer of observers) observer.enter(isIntersecting)
        },
    }
}
