import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  error,
  confirmLabel = 'Confirmer',
  danger = true,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      {error && (
        <p className="mb-4 rounded-lg border border-clay/40 bg-clay/10 px-4 py-2.5 text-sm text-clay-light">{error}</p>
      )}
      {!error && <p className="text-sm text-paper/80">{message}</p>}

      <div className="mt-6 flex justify-end gap-3">
        {error ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone/30 px-4 py-2 text-sm text-paper hover:border-paper/50 transition-colors"
          >
            Fermer
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone/30 px-4 py-2 text-sm text-paper hover:border-paper/50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                danger ? 'bg-clay text-ink hover:bg-clay-light' : 'bg-sage text-paper hover:bg-sage-deep'
              }`}
            >
              {confirmLabel}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
