import { ImageIcon } from './icons.jsx'

/** Espace réservé affiché à la place d'une image famille/produit absente (image null/vide). */
export default function ImagePlaceholder({ className = '' }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-ink-3 ${className}`}>
      <ImageIcon className="w-8 h-8 text-stone/50" />
    </div>
  )
}
