import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

function ToastModal({ toast, onDone }) {
  const isSuccess = toast.tone === 'success'
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)' }}>
      <div
        className={`relative flex flex-col items-center rounded-2xl border p-8 shadow-2xl w-full max-w-sm text-center animate-fade-in ${
          isSuccess
            ? 'bg-surface border-[#D9AE4E]/40'
            : 'bg-surface border-danger/40'
        }`}
      >
        {/* Icon circle */}
        <div className={`flex h-20 w-20 items-center justify-center rounded-full mb-5 ${
          isSuccess ? 'bg-[#D9AE4E]/15 border-2 border-[#D9AE4E]/50' : 'bg-danger/15 border-2 border-danger/50'
        }`}>
          {isSuccess ? (
            <svg className="h-10 w-10 text-[#D9AE4E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="h-10 w-10 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h3 className={`font-display text-2xl font-semibold mb-2 ${isSuccess ? 'text-[#D9AE4E]' : 'text-danger'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </h3>

        {/* Message */}
        <p className="text-sm text-muted leading-relaxed mb-7 px-2">{toast.message}</p>

        {/* Done button */}
        <button
          type="button"
          onClick={onDone}
          className={`w-full rounded-control py-2.5 text-sm font-bold transition-colors cursor-pointer ${
            isSuccess
              ? 'bg-[#D9AE4E] text-[#000] hover:bg-[#A9823A]'
              : 'bg-danger text-white hover:opacity-90'
          }`}
        >
          Done
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const show = useCallback((message, tone = 'success') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, tone }])
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Show one modal at a time (the first in queue)
  const current = toasts[0] ?? null

  return (
    <ToastContext.Provider value={show}>
      {children}
      {current && <ToastModal key={current.id} toast={current} onDone={() => dismiss(current.id)} />}
    </ToastContext.Provider>
  )
}
