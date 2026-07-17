import { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Input from '../../components/ui/Input';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as usersApi from '../../api/users';
import { exportToCSV } from '../../utils/export';

export default function GlobalUsers() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { items, page, setPage, meta, loading } = usePagination(
    usersApi.list,
    { search: debouncedSearch } // userType is NOT passed so it fetches everyone
  );

  const handleExport = () => {
    const data = items.map(u => ({
      'Name': u.fullName,
      'Email': u.email,
      'Role': u.userType,
      'Status': u.status,
      'Organization ID': u.organizationId || 'Root',
      'Created': new Date(u.createdAt).toLocaleDateString()
    }));
    exportToCSV(data, 'global_users');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Directory</span>
          <h1 className="page-title">Global Users</h1>
          <p className="page-subtitle">Manage and view all registered users across the platform.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={handleExport} icon={Download}>Export CSV</Button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <DataTable
          columns={[
            { 
              key: 'user', 
              header: 'User',
              render: (r) => (
                <div className="row" style={{ gap: 'var(--sp-3)' }}>
                  <div className="avatar">{r.fullName.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                    <div className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>{r.email}</div>
                  </div>
                </div>
              )
            },
            { key: 'userType', header: 'Role', render: r => <StatusBadge status={r.userType} /> },
            { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
            { key: 'org', header: 'Organization', render: r => r.organizationId || <span className="text-muted">Root</span> },
            { key: 'createdAt', header: 'Joined', render: r => new Date(r.createdAt).toLocaleDateString() }
          ]}
          rows={items}
          loading={loading}
          pagination={{
            page,
            totalPages: meta.totalPages,
            totalItems: meta.totalItems,
            onPageChange: setPage
          }}
          emptyLabel="No users found."
        />
      </div>
    </div>
  );
}
