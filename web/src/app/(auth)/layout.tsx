export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 hero-gradient bg-grid">
      <div className="relative z-10 w-full max-w-md space-y-8 p-8 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-primary/5">
        {children}
      </div>
    </div>
  )
}
