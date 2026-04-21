import { useEffect, useState } from "react"
import { createBranch, getBranches } from "../api/branches"
import { getEmployments } from "../api/employments"
import { getShifts } from "../api/shifts"
import BranchForm from "../components/branches/BranchForm"
import BranchList from "../components/branches/BranchList"
import EmploymentList from "../components/employments/EmploymentList"
import ShiftList from "../components/shifts/ShiftList"
import type { Branch } from "../types/branch"
import type { Employment } from "../types/employment"
import type { Shift } from "../types/shift"

function DashboardPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [employments, setEmployments] = useState<Employment[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([getBranches(), getEmployments(), getShifts()])
      .then(([branchesData, employmentsData, shiftsData]) => {
        setBranches(branchesData)
        setEmployments(employmentsData)
        setShifts(shiftsData)
      })
      .catch(() => {
        setError("Failed to load dashboard data")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  async function handleCreateBranch(data: { name: string; address: string }) {
    const newBranch = await createBranch(data)
    setBranches((prev) => [newBranch, ...prev])
  }

  if (loading) {
    return <div className="page-state">Loading...</div>
  }

  if (error) {
    return <div className="page-state">{error}</div>
  }

    return (
    <main className="dashboard-page">
        <header className="page-header">
        <h1>BarRoster Dashboard</h1>
        <p>Basic overview of branches, employments, and shifts.</p>
        </header>

        

        <BranchForm onCreate={handleCreateBranch} />

        <div className="dashboard-grid">
        <BranchList branches={branches} />
        <EmploymentList employments={employments} />
        <ShiftList shifts={shifts} />
        </div>
    </main>
    )
}

export default DashboardPage