export default function Eyebrow({ children, tone = 'sage' }) {
  const dot = tone === 'clay' ? 'bg-clay' : 'bg-sage'
  return (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-stone mb-4">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </div>
  )
}
