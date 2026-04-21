import { apiFetch } from "./client"
import type { Shift } from "../types/shift"

export function getShifts() {
  return apiFetch<Shift[]>("/shifts/")
}