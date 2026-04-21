import { apiFetch } from "./client"
import type { Employment } from "../types/employment"

export function getEmployments() {
  return apiFetch<Employment[]>("/employments/")
}