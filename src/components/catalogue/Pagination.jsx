import { ChevronLeftIcon, ChevronRightIcon } from '../icons.jsx'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-10 flex items-center justify-center gap-4 font-mono text-xs uppercase tracking-wider text-stone">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex items-center gap-1.5 rounded-full border border-stone/30 px-4 py-2 text-paper disabled:opacity-30 disabled:cursor-not-allowed hover:border-paper/50 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" /> Précédent
      </button>
      <span>
        Page {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="inline-flex items-center gap-1.5 rounded-full border border-stone/30 px-4 py-2 text-paper disabled:opacity-30 disabled:cursor-not-allowed hover:border-paper/50 transition-colors"
      >
        Suivant <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
