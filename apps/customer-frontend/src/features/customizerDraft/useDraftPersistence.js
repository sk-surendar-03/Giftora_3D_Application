import { useState, useEffect, useRef, useCallback } from 'react'
import {
  saveProductDraft,
  loadProductDraft,
  deleteProductDraft,
} from './draftManager.js'

/**
 * Custom React hook for auto-saving and managing 3D customizer drafts.
 *
 * @param {string} productType - 'keychain' | 'nameplate'
 * @param {any} currentData - current design object to persist
 * @param {Function} sanitizeFn - function(rawDraft) => cleanData
 * @param {number} debounceMs - auto-save debounce delay (default 1200ms)
 */
export function useDraftPersistence({
  productType,
  currentData,
  sanitizeFn,
  debounceMs = 1200,
}) {
  const [draftRecord, setDraftRecord] = useState(() => loadProductDraft(productType))
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved'
  const isFirstRender = useRef(true)
  const debounceTimerRef = useRef(null)

  // Re-check stored draft on mount or product switch
  const refreshDraftRecord = useCallback(() => {
    const record = loadProductDraft(productType)
    setDraftRecord(record)
    return record
  }, [productType])

  // Debounced auto-save when currentData changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!currentData) return

    setSaveStatus('saving')
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      const ok = saveProductDraft(productType, currentData)
      if (ok) {
        setDraftRecord({ data: currentData, savedAt: Date.now() })
        setSaveStatus('saved')
      } else {
        setSaveStatus('idle')
      }
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [currentData, productType, debounceMs])

  // Manual save
  const handleManualSave = useCallback(() => {
    if (!currentData) return false
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    const ok = saveProductDraft(productType, currentData)
    if (ok) {
      setDraftRecord({ data: currentData, savedAt: Date.now() })
      setSaveStatus('saved')
    }
    return ok
  }, [currentData, productType])

  // Manual delete
  const handleDeleteDraft = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    deleteProductDraft(productType)
    setDraftRecord(null)
    setSaveStatus('idle')
  }, [productType])

  // Restore draft
  const getRestoredData = useCallback(() => {
    const latest = loadProductDraft(productType)
    if (!latest || !latest.data) return null
    if (typeof sanitizeFn === 'function') {
      return sanitizeFn(latest.data)
    }
    return latest.data
  }, [productType, sanitizeFn])

  return {
    hasDraft: Boolean(draftRecord?.data),
    savedAt: draftRecord?.savedAt || null,
    saveStatus,
    saveDraft: handleManualSave,
    deleteDraft: handleDeleteDraft,
    getRestoredData,
    refreshDraftRecord,
  }
}
