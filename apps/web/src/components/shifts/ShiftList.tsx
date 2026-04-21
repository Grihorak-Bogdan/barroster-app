import type { Shift } from "../../types/shift"
import SectionCard from "../ui/SectionCard"

type ShiftListProps = {
  shifts: Shift[]
}

function ShiftList({ shifts }: ShiftListProps) {
  return (
    <SectionCard title="Shifts">
      {shifts.length === 0 ? (
        <p>No shifts yet.</p>
      ) : (
        <ul>
          {shifts.map((shift) => (
            <li key={shift.id}>
              <strong>{shift.branch_name}</strong> — {shift.status} — {new Date(shift.start_time).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

export default ShiftList