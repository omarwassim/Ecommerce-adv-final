import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAdminData } from '../../context/AdminDataContext.jsx'
import { formatDateTime } from '../../lib/format.js'
import { fetchAuditLog } from '../../api/admin.js'
import './AdminAuditLogPage.css'

const PAGE_SIZE = 10

export default function AdminAuditLogPage() {
  const { isAdmin } = useAuth()
  const { auditLog } = useAdminData()
  const [page, setPage] = useState(1)
  const [remote, setRemote] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    fetchAuditLog({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (!cancelled && res.entries?.length) setRemote(res)
      })
      .catch(() => {
        /* fall back to the local in-memory audit log */
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin, page])

  const usingRemote = !!remote
  const totalCount = usingRemote ? remote.totalCount : auditLog.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const entries = usingRemote
    ? remote.entries
    : auditLog.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AdminLayout title="Audit log" description="Every admin write action, newest first.">
      {!isAdmin && (
        <p className="admin-note">
          Showing locally-recorded actions only — sign in as an admin to load the server audit log.
        </p>
      )}

      {entries.length === 0 ? (
        <p className="admin-note">No admin write actions recorded yet.</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDateTime(e.at)}</td>
                    <td>{e.actorName || e.actorId || '—'}</td>
                    <td className="audit__action">{e.action}</td>
                    <td>
                      {e.entityType}
                      {e.entityId ? ` #${e.entityId}` : ''}
                    </td>
                    <td>{e.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="audit__pager">
            <button
              className="admin-btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span className="audit__pager-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="admin-btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
