import { X, Loader2 } from 'lucide-react'

interface DrawerProps {
  open: boolean
  title: string
  subtitle?: string
  width?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

interface DrawerFooterProps {
  cancelLabel?: string
  confirmLabel?: string
  loading?: boolean
  disabled?: boolean
  loadingLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export function DrawerFooter({
  cancelLabel = 'Cancel',
  confirmLabel = 'Save',
  loading = false,
  disabled = false,
  loadingLabel,
  onCancel,
  onConfirm,
}: DrawerFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="flex-1 border border-gray-200 text-gray-700 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading || disabled}
        className="flex-1 bg-[#0F172A] text-white text-sm py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {loading ? (loadingLabel ?? 'Saving...') : confirmLabel}
      </button>
    </div>
  )
}

export default function Drawer({
  open,
  title,
  subtitle,
  width = 'w-[440px]',
  onClose,
  children,
  footer,
}: DrawerProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 h-full ${width} bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer slot */}
        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </>
  )
}
