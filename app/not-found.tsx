export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#232120] text-[#e4dfd5]">
      <div className="space-y-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#e0b25a]">404</p>
        <h1 className="font-serif text-3xl font-normal tracking-[-0.015em]">Page not found</h1>
        <p className="text-sm text-[#e4dfd5]/58">That route doesn&apos;t exist. Head back to the front page and pick a section.</p>
      </div>
    </div>
  )
}
