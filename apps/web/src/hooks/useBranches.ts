import { useEffect, useState } from 'react'
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  type BranchPayload,
} from '../api/branches'
import type { Branch } from '../types/branch'

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = () => {
    setLoading(true)
    getBranches()
      .then(setBranches)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(fetch, [])

  const create = async (data: BranchPayload) => {
    const branch = await createBranch(data)
    setBranches((prev) => [branch, ...prev])
    return branch
  }

  const update = async (id: string, data: Partial<BranchPayload>) => {
    const branch = await updateBranch(id, data)
    setBranches((prev) => prev.map((b) => (b.id === id ? branch : b)))
    return branch
  }

  const remove = async (id: string) => {
    await deleteBranch(id)
    setBranches((prev) => prev.filter((b) => b.id !== id))
  }

  return { branches, loading, error, refetch: fetch, create, update, remove }
}
