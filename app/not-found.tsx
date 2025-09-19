export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Page Not Found</h1>
        <p className="text-sm text-white/60">This route does not exist. Use the navigation to choose a section.</p>
      </div>
    </div>
  )
}
