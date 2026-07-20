import { useState } from 'react';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as auditApi from '../../api/audit';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { items, page, setPage, meta, loading } = usePagination(auditApi.list, { search: debouncedSearch });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Super admin</span>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Read-only trail of platform activity.</p>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search logs…" />
      </div>

      <DataTable
        loading={loading}
        emptyLabel="No audit entries found."
        columns={[
          { key: 'createdAt', header: 'Timestamp', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—') },
          { key: 'user', header: 'User', render: (r) => r.actorId?.fullName || r.actorId?.email || r.actorId?.id || '—' },
          { key: 'action', header: 'Action' },
          { key: 'resource', header: 'Resource', render: (r) => r.organizationId?.name || r.targetId || '—' },
          { key: 'details', header: 'Details', render: (r) => <span className="text-muted">{typeof r.metadata === 'string' ? r.metadata : JSON.stringify(r.metadata || {})}</span> },
        ]}
        rows={items}
      />

      <Pagination currentPage={page} totalPages={meta.totalPages} totalItems={meta.totalItems} onChange={setPage} />
    </div>
  );
}
