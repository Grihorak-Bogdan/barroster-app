import { apiFetch } from "./client"
import type { AuthUser } from "./auth"

export function getUsers() {
  return apiFetch<AuthUser[]>("/users/")
}
