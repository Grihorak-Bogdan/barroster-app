import { AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  loadingLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loadingLabel,
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={!loading ? onClose : undefined} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-700 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0F172A] hover:bg-slate-800'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? (loadingLabel ?? `${confirmLabel}ing…`) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
