import { useState } from 'react';
import { Plus, Eye, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as organizationsApi from '../../api/organizations';
import { extractErrorMessages } from '../../api/client';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CreateOrganizationModal from './CreateOrganizationModal';

export default function Organizations() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const { items, page, setPage, meta, loading, refresh } = usePagination(
    organizationsApi.list,
    { search: debouncedSearch }
  );

  const toggleStatus = async () => {
    if (!toggleTarget) return;
    const next = toggleTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await organizationsApi.updateStatus(toggleTarget._id || toggleTarget.id, next);
      toast.success(`Organization ${next.toLowerCase()}`);
      setToggleTarget(null);
      refresh();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Super admin</span>
          <h1 className="page-title">Organizations</h1>
          <p className="page-subtitle">Every institution running on Ledger LMS.</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Create Organization
        </Button>
      </div>

      <div className="row" style={{ marginBottom: 'var(--sp-4)' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search organizations…" />
      </div>

      <DataTable
        loading={loading}
        emptyLabel="No organizations found."
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'code', header: 'Code' },
          { key: 'slug', header: 'Slug', render: (r) => r.slug || '—' },
          { key: 'planType', header: 'Plan', render: (r) => r.subscriptionConfig?.planType || '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'maxStudents', header: 'Max Students', render: (r) => r.subscriptionConfig?.maxStudents ?? '—' },
          { key: 'createdAt', header: 'Created', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
          { 
            key: 'endDate', 
            header: 'End Date', 
            render: (r) => {
              const expiresAt = r.subscriptionConfig?.expiresAt;
              if (!expiresAt) return '—';
              const date = new Date(expiresAt);
              const diffDays = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 10) {
                return (
                  <span style={{ 
                    backgroundColor: 'var(--danger-bg)', 
                    color: 'var(--danger)', 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-sm)', 
                    fontWeight: 600,
                    fontSize: 'var(--fs-xs)'
                  }}>
                    {date.toLocaleDateString()}
                  </span>
                );
              }
              return date.toLocaleDateString();
            }
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (r) => (
              <div className="row" style={{ gap: 6 }}>
                <Link to={`/super-admin/organizations/${r._id || r.id}`} state={{ org: r }}>
                  <Button size="sm" variant="ghost" icon={Eye}>View</Button>
                </Link>
                <Button size="sm" variant="outline" icon={Power} onClick={() => setToggleTarget(r)}>
                  {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ),
          },
        ]}
        rows={items}
      />

      <Pagination currentPage={page} totalPages={meta.totalPages} totalItems={meta.totalItems} onChange={setPage} />

      <CreateOrganizationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          refresh();
        }}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={toggleStatus}
        title={`${toggleTarget?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Organization?`}
        description={`Are you sure you want to ${toggleTarget?.status === 'ACTIVE' ? 'deactivate' : 'activate'} "${toggleTarget?.name}"?`}
        confirmLabel="Confirm"
      />
    </div>
  );
}
