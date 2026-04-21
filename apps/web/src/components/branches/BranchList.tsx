import type { Branch } from "../../types/branch"
import SectionCard from "../ui/SectionCard"

type BranchListProps = {
  branches: Branch[]
}

function BranchList({ branches }: BranchListProps) {
  return (
    <SectionCard title="Branches">
      {branches.length === 0 ? (
        <p>No branches yet.</p>
      ) : (
        <ul>
          {branches.map((branch) => (
            <li key={branch.id}>
              <strong>{branch.name}</strong> — {branch.address}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

export default BranchList