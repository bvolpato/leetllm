/**
 * Vitest setup: provide a working in-memory Web Storage implementation.
 *
 * Node 25+ ships an experimental built-in `localStorage` that is active but
 * throws ("clear is not a function") unless launched with a valid
 * `--localstorage-file` path. That broken global shadows jsdom's storage, so we
 * install a deterministic in-memory Storage on both `window` and `globalThis`.
 */

class MemoryStorage implements Storage {
    private store = new Map<string, string>()

    get length(): number {
        return this.store.size
    }

    clear(): void {
        this.store.clear()
    }

    getItem(key: string): string | null {
        return this.store.has(key) ? (this.store.get(key) as string) : null
    }

    key(index: number): string | null {
        return Array.from(this.store.keys())[index] ?? null
    }

    removeItem(key: string): void {
        this.store.delete(key)
    }

    setItem(key: string, value: string): void {
        this.store.set(key, String(value))
    }
}

function installStorage(name: 'localStorage' | 'sessionStorage'): void {
    const storage = new MemoryStorage()
    const targets: Array<Record<string, unknown>> = [globalThis as unknown as Record<string, unknown>]
    if (typeof window !== 'undefined' && (window as unknown) !== globalThis) {
        targets.push(window as unknown as Record<string, unknown>)
    }
    for (const target of targets) {
        Object.defineProperty(target, name, {
            value: storage,
            configurable: true,
            writable: true,
        })
    }
}

installStorage('localStorage')
installStorage('sessionStorage')
