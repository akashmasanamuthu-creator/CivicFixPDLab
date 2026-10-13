import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // usage: const toast = useToast(); toast('Saved!')  or  toast('Oops', 'error')
  const show = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, type }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lift ${
              t.type === 'error' ? 'border-red-200' : 'border-teal-200'
            }`}
          >
            {t.type === 'error' ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
            )}
            <p className="flex-1 font-medium text-navy-800">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-navy-300 hover:text-navy-600" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
