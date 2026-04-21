import React from "react";
import { useState } from "react"

type BranchFormProps = {
  onCreate: (data: { name: string; address: string }) => Promise<void>
}

function BranchForm({ onCreate }: BranchFormProps) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!name.trim() || !address.trim()) {
      setError("Name and address are required")
      return
    }

    try {
      setSubmitting(true)
      await onCreate({
        name: name.trim(),
        address: address.trim(),
      })
      setName("")
      setAddress("")
    } catch {
      setError("Failed to create branch")
    } finally {
      setSubmitting(false)
    }
  }

    return (
    <form onSubmit={handleSubmit} className="branch-form">
      <h3>Create Branch</h3>

      <div className="form-group">
        <label htmlFor="branch-name">Name</label>
        <input
          id="branch-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Main Bar"
        />
      </div>

      <div className="form-group">
        <label htmlFor="branch-address">Address</label>
        <input
          id="branch-address"
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Warsaw, Main Street 12"
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Branch"}
      </button>
    </form>
  )
}

export default BranchForm