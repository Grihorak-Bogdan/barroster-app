import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-white border-emerald-200 text-emerald-700 [&_svg]:text-emerald-500',
  error: 'bg-white border-red-200 text-red-700 [&_svg]:text-red-500',
  warning: 'bg-white border-amber-200 text-amber-700 [&_svg]:text-amber-500',
  info: 'bg-white border-sky-200 text-sky-700 [&_svg]:text-sky-500',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = ICONS[toast.type]
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium min-w-[280px] max-w-sm ${STYLES[toast.type]}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="text-current opacity-50 hover:opacity-100 transition-opacity shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
