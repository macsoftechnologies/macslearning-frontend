import { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Input from '../../components/ui/Input';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as organizationsApi from '../../api/organizations';
import { exportToCSV } from '../../utils/export';

export default function GlobalPayments() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // We are fetching organizations to read their subscription/payment details
  const { items, page, setPage, meta, loading } = usePagination(
    organizationsApi.list,
    { search: debouncedSearch }
  );

  const handleExport = () => {
    const data = items.map(org => {
      const sub = org.subscriptionConfig || {};
      return {
        'Transaction ID': sub.paymentReferenceId || 'N/A',
        'Organization': org.name,
        'Plan': sub.planType || 'N/A',
        'Amount': sub.price ? `${sub.currency || 'USD'} ${sub.price}` : 'N/A',
        'Status': sub.paymentStatus || 'PENDING',
        'Date Paid': sub.lastPaymentDate ? new Date(sub.lastPaymentDate).toLocaleDateString() : 'N/A',
        'Expires At': sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'N/A'
      };
    });
    exportToCSV(data, 'organization_payments');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Finance</span>
          <h1 className="page-title">Global Payments</h1>
          <p className="page-subtitle">Track SaaS subscription payments across all organizations.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={handleExport} icon={Download}>Export CSV</Button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <DataTable
          columns={[
            { key: 'ref', header: 'Transaction ID', render: r => <span style={{ fontFamily: 'monospace' }}>{r.subscriptionConfig?.paymentReferenceId || 'N/A'}</span> },
            { key: 'org', header: 'Organization', render: r => <strong>{r.name}</strong> },
            { key: 'plan', header: 'Plan', render: r => r.subscriptionConfig?.planType || '—' },
            { key: 'amount', header: 'Amount', render: r => {
                const price = r.subscriptionConfig?.price;
                return price ? <strong>{r.subscriptionConfig?.currency || 'USD'} {price}</strong> : '—';
            } },
            { key: 'status', header: 'Status', render: r => <StatusBadge status={r.subscriptionConfig?.paymentStatus || 'PENDING'} /> },
            { key: 'date', header: 'Date Paid', render: r => r.subscriptionConfig?.lastPaymentDate ? new Date(r.subscriptionConfig.lastPaymentDate).toLocaleDateString() : '—' },
            { key: 'expires', header: 'Expires At', render: r => r.subscriptionConfig?.expiresAt ? new Date(r.subscriptionConfig.expiresAt).toLocaleDateString() : '—' }
          ]}
          rows={items}
          loading={loading}
          pagination={{
            page,
            totalPages: meta.totalPages,
            totalItems: meta.totalItems,
            onPageChange: setPage
          }}
          emptyLabel="No organization subscription payments found."
        />
      </div>
    </div>
  );
}
