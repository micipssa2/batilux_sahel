import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons.jsx'

export default function Lightbox({ images, index, onClose, onNavigate }) {
  const isOpen = index !== null && index >= 0 && images.length > 0

  // Verrouille le scroll de la page tant que la lightbox est ouverte, et
  // restaure exactement la valeur précédente au démontage (pas un simple
  // `overflow: hidden` en dur qui peut rester coincé si un autre composant
  // manipule aussi document.body.style.overflow).
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNavigate(-1)
      if (e.key === 'ArrowRight') onNavigate(1)
    },
    [isOpen, onClose, onNavigate]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center px-4"
          onClick={onClose}
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-paper hover:text-clay-light transition-colors"
          >
            <CloseIcon className="w-7 h-7" />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Image précédente"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate(-1)
              }}
              className="absolute left-2 sm:left-8 p-2 text-paper hover:text-clay-light transition-colors"
            >
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
          )}

          <motion.img
            key={images[index]}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            src={images[index]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Image suivante"
              onClick={(e) => {
                e.stopPropagation()
                onNavigate(1)
              }}
              className="absolute right-2 sm:right-8 p-2 text-paper hover:text-clay-light transition-colors"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
