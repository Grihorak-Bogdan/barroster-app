import type { Employment } from "../../types/employment"
import SectionCard from "../ui/SectionCard"

type EmploymentListProps = {
  employments: Employment[]
}

function EmploymentList({ employments }: EmploymentListProps) {
  return (
    <SectionCard title="Employments">
      {employments.length === 0 ? (
        <p>No employments yet.</p>
      ) : (
        <ul>
          {employments.map((employment) => (
            <li key={employment.id}>
              <strong>{employment.user_email}</strong> — {employment.position} — {employment.branch_name} — {employment.status}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

export default EmploymentList