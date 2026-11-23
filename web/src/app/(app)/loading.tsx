export default function AppLoading() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-muted/40 rounded-lg animate-pulse mb-2" />
                    <div className="h-4 w-72 bg-muted/25 rounded animate-pulse" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-28 bg-muted/30 rounded-lg animate-pulse" />
                </div>
            </div>

            {/* Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <div className="h-5 w-32 bg-muted/30 rounded animate-pulse" />
                            <div className="w-8 h-8 bg-muted/20 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-8 w-16 bg-muted/40 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted/20 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    )
}
