import { apiFetch } from "./client"
import type { Branch } from "../types/branch"


type CreateBranchPayload = {
  name: string
  address: string
}

export function getBranches() {
  return apiFetch<Branch[]>("/branches/")
}

export async function createBranch(payload: CreateBranchPayload): Promise<Branch> {
    const response = await fetch("http://127.0.0.1:8000/api/branches/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Failed to create branch")
  }

  return response.json()
}