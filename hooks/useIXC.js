'use client'

import { useState, useCallback } from 'react'
import { IXCService, parseIXCJson, parseIXCCsv, normalizeIXCData, groupIXCByDate } from '@/lib/ixc/service'

export function useIXC() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetchFromAPI = useCallback(async ({ mes, ano }) => {
    setIsLoading(true)
    setError(null)

    try {
      const ixc = new IXCService()
      const response = await ixc.getRecebimentos({ mes, ano })
      const parsed = ixc.parseRecebimentos(response)
      
      setData(parsed)
      return parsed
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const importFromFile = useCallback(async (file) => {
    setIsLoading(true)
    setError(null)

    try {
      const content = await file.text()
      let result

      const ext = file.name.split('.').pop().toLowerCase()

      if (ext === 'json') {
        result = parseIXCJson(content)
      } else if (ext === 'csv') {
        result = parseIXCCsv(content)
      } else if (ext === 'txt') {
        result = parseIXCCsv(content)
      } else {
        throw new Error(`Formato não suportado: ${ext}`)
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      const normalized = normalizeIXCData(result.data)
      const daily = groupIXCByDate(normalized)

      const processed = { records: normalized, daily }
      setData(processed)
      return processed
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const importFromText = useCallback(async (text, format = 'json') => {
    setIsLoading(true)
    setError(null)

    try {
      let result

      if (format === 'json') {
        result = parseIXCJson(text)
      } else if (format === 'csv') {
        result = parseIXCCsv(text)
      } else {
        throw new Error(`Formato não suportado: ${format}`)
      }

      if (!result.success) {
        throw new Error(result.error)
      }

      const normalized = normalizeIXCData(result.data)
      const daily = groupIXCByDate(normalized)

      const processed = { records: normalized, daily }
      setData(processed)
      return processed
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    data,
    fetchFromAPI,
    importFromFile,
    importFromText,
    clear,
  }
}

export default useIXC