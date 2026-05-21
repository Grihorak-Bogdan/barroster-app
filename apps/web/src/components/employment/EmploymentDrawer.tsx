import { useEffect, useState } from 'react'
import { X, User, Building2, Briefcase, DollarSign, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getBranches } from '../../api/branches'
import { getUsers } from '../../api/users'
import {
  createEmployment,
  updateEmployment,
  createCompensation,
  updateCompensation,
} from '../../api/employments'
import type { Branch } from '../../types/branch'
import type { AuthUser } from '../../api/auth'
import type { Employment } from '../../types/employment'

interface Props {
  open: boolean
  employment?: Employment | null
  onClose: () => void
  onSaved: () => void
}

const ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner' },
]

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
]

const PAYMENT_TYPES = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'monthly', label: 'Monthly Salary' },
  { value: 'shift_based', label: 'Shift Based' },
]

const BONUS_TYPES = [
  { value: 'none', label: 'No Bonus' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'percent', label: 'Percentage' },
]

const inputCls = 'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white'
const selectCls = inputCls + ' appearance-none cursor-pointer'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5'

type Step = 'employment' | 'compensation'

export default function EmploymentDrawer({ open, employment, onClose, onSaved }: Props) {
  const isEdit = !!employment
  const [step, setStep] = useState<Step>('employment')
  const [branches, setBranches] = useState<Branch[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Employment fields
  const [userId, setUserId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [position, setPosition] = useState('')
  const [role, setRole] = useState('staff')
  const [hireDate, setHireDate] = useState('')
  const [empStatus, setEmpStatus] = useState('active')

  // Compensation fields
  const [addComp, setAddComp] = useState(true)
  const [paymentType, setPaymentType] = useState('hourly')
  const [hourlyRate, setHourlyRate] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [bonusType, setBonusType] = useState('none')
  const [bonusValue, setBonusValue] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')

  // Load branches + users when drawer opens
  useEffect(() => {
    if (!open) return
    Promise.all([getBranches(), getUsers()]).then(([b, u]) => {
      setBranches(b)
      setUsers(u)
    })
  }, [open])

  // Populate fields when editing
  useEffect(() => {
    if (!open) return
    if (employment) {
      setUserId(employment.user)
      setBranchId(employment.branch)
      setPosition(employment.position)
      setRole(employment.role)
      setHireDate(employment.hire_date)
      setEmpStatus(employment.status)

      const comp = employment.compensations?.[0]
      if (comp) {
        setAddComp(true)
        setPaymentType(comp.payment_type)
        setHourlyRate(comp.hourly_rate ?? '')
        setBaseSalary(comp.base_salary ?? '')
        setBonusType(comp.bonus_type)
        setBonusValue(comp.bonus_value)
        setEffectiveFrom(comp.effective_from)
      } else {
        setAddComp(false)
      }
    } else {
      resetFields()
    }
  }, [open, employment])

  function resetFields() {
    setStep('employment')
    setUserId('')
    setBranchId('')
    setPosition('')
    setRole('staff')
    setHireDate('')
    setEmpStatus('active')
    setAddComp(true)
    setPaymentType('hourly')
    setHourlyRate('')
    setBaseSalary('')
    setBonusType('none')
    setBonusValue('')
    setEffectiveFrom('')
    setError('')
  }

  function handleClose() {
    resetFields()
    onClose()
  }

  function validateEmployment() {
    if (!userId) return 'Select a user'
    if (!branchId) return 'Select a branch'
    if (!position.trim()) return 'Position is required'
    if (!hireDate) return 'Hire date is required'
    return null
  }

  function validateCompensation() {
    if (!addComp) return null
    if (!effectiveFrom) return 'Effective from date is required'
    if (paymentType === 'hourly' && !hourlyRate) return 'Hourly rate is required'
    if (paymentType === 'monthly' && !baseSalary) return 'Base salary is required'
    return null
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault()
    const err = validateEmployment()
    if (err) { setError(err); return }
    setError('')
    setStep('compensation')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateCompensation()
    if (err) { setError(err); return }

    setSaving(true)
    setError('')
    try {
      let empId: string

      if (isEdit) {
        await updateEmployment(employment!.id, {
          branch: branchId,
          position: position.trim(),
          role,
          hire_date: hireDate,
          status: empStatus,
        })
        empId = employment!.id
      } else {
        const created = await createEmployment({
          user: userId,
          branch: branchId,
          position: position.trim(),
          role,
          hire_date: hireDate,
          status: empStatus,
        })
        empId = created.id
      }

      if (addComp) {
        const compPayload = {
          employment: empId,
          payment_type: paymentType,
          hourly_rate: paymentType === 'hourly' ? hourlyRate : null,
          base_salary: paymentType === 'monthly' ? baseSalary : null,
          bonus_type: bonusType,
          bonus_value: bonusValue || '0',
          effective_from: effectiveFrom,
        }
        const existingComp = employment?.compensations?.[0]
        if (existingComp) {
          await updateCompensation(existingComp.id, compPayload)
        } else {
          await createCompensation(compPayload)
        }
      }

      resetFields()
      onSaved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('unique')) {
        setError('This user already has an employment at this branch on that date.')
      } else {
        setError(isEdit ? 'Failed to save changes.' : 'Failed to create employment.')
      }
    } finally {
      setSaving(false)
    }
  }

  function userLabel(u: AuthUser) {
    if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name} (${u.email})`
    return u.email
  }

  const step1Done = isEdit || step === 'compensation'

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={handleClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? 'Edit Employment' : 'Add Employment'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 'employment' ? 'Step 1 of 2 — Employment details' : 'Step 2 of 2 — Compensation'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators — clickable in edit mode */}
        <div className="px-6 pt-4 pb-2 flex gap-2">
          {(['employment', 'compensation'] as Step[]).map((s, i) => {
            const isDone = i === 0 && step1Done
            const isActive = step === s
            const clickable = isEdit || isDone
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => clickable && (setStep(s), setError(''))}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#0F172A] text-white'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </button>
                <span className={`text-xs ${isActive ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {s === 'employment' ? 'Employment' : 'Compensation'}
                </span>
                {i === 0 && <div className="flex-1 h-px bg-gray-200 ml-1" />}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 'employment' ? (
            <form id="emp-form" onSubmit={handleNextStep} className="space-y-4">
              {/* User — locked in edit mode */}
              <div>
                <label className={labelCls}>
                  <User className="w-3 h-3 inline mr-1" />
                  Employee *
                </label>
                {isEdit ? (
                  <div className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`}>
                    {users.find((u) => u.id === userId)
                      ? userLabel(users.find((u) => u.id === userId)!)
                      : employment?.user_email ?? '—'}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">Select user...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{userLabel(u)}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                {isEdit && (
                  <p className="text-xs text-gray-400 mt-1">User cannot be changed after creation.</p>
                )}
              </div>

              {/* Branch */}
              <div>
                <label className={labelCls}>
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Branch *
                </label>
                <div className="relative">
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className={labelCls}>
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Position *
                </label>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Head Bartender"
                  className={inputCls}
                />
              </div>

              {/* Role + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Role *</label>
                  <div className="relative">
                    <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <div className="relative">
                    <select value={empStatus} onChange={(e) => setEmpStatus(e.target.value)} className={selectCls}>
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Hire Date */}
              <div>
                <label className={labelCls}>Hire Date *</label>
                <input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </form>
          ) : (
            <form id="comp-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {isEdit && employment?.compensations?.[0] ? 'Update Compensation' : 'Add Compensation'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Set rate and bonus details</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddComp((v) => !v)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors shrink-0 ${
                    addComp ? 'bg-sky-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      addComp ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {addComp && (
                <>
                  {/* Payment Type */}
                  <div>
                    <label className={labelCls}>
                      <DollarSign className="w-3 h-3 inline mr-1" />
                      Payment Type *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_TYPES.map((pt) => (
                        <button
                          key={pt.value}
                          type="button"
                          onClick={() => setPaymentType(pt.value)}
                          className={`border rounded-lg py-2 px-3 text-xs font-medium transition-colors ${
                            paymentType === pt.value
                              ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentType === 'hourly' && (
                    <div>
                      <label className={labelCls}>Hourly Rate ($) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="0.00"
                        className={inputCls}
                      />
                    </div>
                  )}
                  {paymentType === 'monthly' && (
                    <div>
                      <label className={labelCls}>Monthly Salary ($) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(e.target.value)}
                        placeholder="0.00"
                        className={inputCls}
                      />
                    </div>
                  )}

                  {/* Bonus */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Bonus Type</label>
                      <div className="relative">
                        <select value={bonusType} onChange={(e) => setBonusType(e.target.value)} className={selectCls}>
                          {BONUS_TYPES.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    {bonusType !== 'none' && (
                      <div>
                        <label className={labelCls}>
                          {bonusType === 'percent' ? 'Bonus %' : 'Bonus $'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={bonusValue}
                          onChange={(e) => setBonusValue(e.target.value)}
                          placeholder="0"
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>

                  {/* Effective From */}
                  <div>
                    <label className={labelCls}>Effective From *</label>
                    <input
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </>
              )}

              {!addComp && (
                <p className="text-sm text-gray-400 text-center py-6">
                  {isEdit
                    ? 'Compensation will remain unchanged.'
                    : 'Compensation can be added later from the employee profile.'}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step === 'employment' ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="emp-form"
                className="flex-1 bg-[#0F172A] text-white text-sm py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Next: Compensation
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setStep('employment'); setError('') }}
                className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                form="comp-form"
                disabled={saving}
                className="flex-1 bg-[#0F172A] text-white text-sm py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-60"
              >
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employment'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
