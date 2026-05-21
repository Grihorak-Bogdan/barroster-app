import { useEffect, useState } from 'react'
import { getEmployments } from '../api/employments'
import type { Employment } from '../types/employment'

export function useEmployments() {
  const [employments, setEmployments] = useState<Employment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = () => {
    setLoading(true)
    getEmployments()
      .then(setEmployments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetch, [])

  return { employments, loading, error, refetch: fetch }
}
