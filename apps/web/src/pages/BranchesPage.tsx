import { useEffect, useRef, useState } from 'react'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Building2,
  MapPin,
  Users,
  X,
  ChevronDown,
  Wine,
  Beer,
  Pencil,
  Trash2,
} from 'lucide-react'
import { getBranches, createBranch, updateBranch, deleteBranch } from '../api/branches'
import { getEmployments } from '../api/employments'
import { ForbiddenError } from '../api/client'
import type { Branch, BranchStatus } from '../types/branch'
import type { Employment } from '../types/employment'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useToast } from '../contexts/ToastContext'
import { useRole } from '../hooks/useRole'
import { AVATAR_COLORS, ROLE_LABELS, getDisplayName, getInitials } from '../utils/ui'

const PAGE_SIZE = 8

// Manager first, owner as fallback
function getBranchContact(branchId: string, employments: Employment[]): Employment | null {
  const active = employments.filter((e) => e.branch === branchId && e.status === 'active')
  return (
    active.find((e) => e.role === 'manager') ??
    active.find((e) => e.role === 'owner') ??
    null
  )
}

const STATUS_OPTIONS: { value: BranchStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
]

function branchIconEl(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('pub') || lower.includes('tavern')) return Beer
  if (lower.includes('lounge') || lower.includes('cellar')) return Wine
  return Building2
}

function branchIconBg(idx: number) {
  return ['bg-sky-100 text-sky-600', 'bg-orange-100 text-orange-600', 'bg-gray-100 text-gray-400', 'bg-red-100 text-red-500'][idx % 4]
}

interface BranchModalProps {
  branch?: Branch | null
  onClose: () => void
  onSave: (data: { name: string; address: string; status: BranchStatus }) => Promise<void>
}

function BranchModal({ branch, onClose, onSave }: BranchModalProps) {
  const isEdit = !!branch
  const [name, setName] = useState(branch?.name ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [status, setStatus] = useState<BranchStatus>(branch?.status ?? 'active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !address.trim()) { setError('Name and address are required.'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), address: address.trim(), status })
      onClose()
    } catch (err) {
      setError(
        err instanceof ForbiddenError
          ? 'Only owners can manage branches.'
          : `Failed to ${isEdit ? 'update' : 'create'} branch.`,
      )
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Branch' : 'Create New Branch'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Downtown Lounge" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 124 Main St, Downtown" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                    status === opt.value
                      ? opt.value === 'active'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : opt.value === 'maintenance'
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#0F172A] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BranchRowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1">
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete() }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function BranchesPage() {
  const { toast } = useToast()
  const { isOwner } = useRole()
  const [branches, setBranches] = useState<Branch[]>([])
  const [employments, setEmployments] = useState<Employment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    Promise.all([getBranches(), getEmployments()])
      .then(([b, e]) => { setBranches(b); setEmployments(e) })
      .catch((err) => { if (!(err instanceof ForbiddenError)) toast('Failed to load branches.', 'error') })
      .finally(() => setLoading(false))
  }, [])

  const filtered = branches.filter((b) => {
    const q = search.toLowerCase()
    return b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
  })

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleCreate(data: { name: string; address: string; status: BranchStatus }) {
    const branch = await createBranch(data)
    setBranches((prev) => [branch, ...prev])
    toast('Branch created successfully')
  }

  async function handleUpdate(data: { name: string; address: string; status: BranchStatus }) {
    if (!editTarget) return
    const updated = await updateBranch(editTarget.id, data)
    setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    toast('Branch updated successfully')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBranch(deleteTarget.id)
      setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      toast('Branch deleted', 'success')
      setDeleteTarget(null)
    } catch (err) {
      if (!(err instanceof ForbiddenError)) toast('Failed to delete branch', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const statusVariantMap: Record<string, 'green' | 'gray' | 'amber'> = {
    active: 'green', inactive: 'gray', maintenance: 'amber',
  }
  const statusLabelMap: Record<string, string> = {
    active: 'Active', inactive: 'Inactive', maintenance: 'Maintenance',
  }

  return (
    <div className="p-6 max-w-[1400px]">
      {(showModal || editTarget) && (
        <BranchModal
          branch={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSave={editTarget ? handleUpdate : handleCreate}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Branch"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Branch"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => !deleting && setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your locations, managers, and staff capacity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          {isOwner && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true) }}
              className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Branch
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search branches or addresses..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <button className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
            All Statuses
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Branch Details', 'Manager', 'Staff Count', 'Status', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  className={`text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5 ${i === 4 ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  {search ? 'No branches match your search.' : 'No branches yet. Create your first one!'}
                </td>
              </tr>
            ) : (
              paged.map((branch, idx) => {
                const realIdx = (page - 1) * PAGE_SIZE + idx
                const contact = getBranchContact(branch.id, employments)
                const staffCount = employments.filter(
                  (e) => e.branch === branch.id && e.status === 'active',
                ).length
                const Icon = branchIconEl(branch.name)
                const iconBg = branchIconBg(realIdx)

                return (
                  <tr key={branch.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {branch.address}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {contact === null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs font-medium">—</span>
                          </div>
                          <span className="text-sm text-gray-400 italic">Unassigned</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${AVATAR_COLORS[realIdx % AVATAR_COLORS.length]}`}>
                            <span className="text-white text-[10px] font-semibold">{getInitials(contact)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{getDisplayName(contact)}</p>
                            <p className="text-xs text-gray-400">{ROLE_LABELS[contact.role] ?? contact.role}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{staffCount}</span>
                        <span className="text-gray-400">active</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariantMap[branch.status] ?? 'gray'} dot>
                        {statusLabelMap[branch.status] ?? branch.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isOwner && (
                        <BranchRowMenu
                          onEdit={() => setEditTarget(branch)}
                          onDelete={() => setDeleteTarget(branch)}
                        />
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">{Math.min((page - 1) * PAGE_SIZE + 1, total)}</span>{' '}
            to{' '}
            <span className="font-medium text-gray-700">{Math.min(page * PAGE_SIZE, total)}</span>{' '}
            of <span className="font-medium text-gray-700">{total}</span> branches
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="border border-gray-200 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
