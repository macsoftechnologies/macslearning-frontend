import { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Input from '../../components/ui/Input';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import * as paymentsApi from '../../api/payments';
import { downloadCSV } from '../../utils/export';

export default function GlobalPayments() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { items, page, setPage, meta, loading } = usePagination(
    paymentsApi.superAdminList,
    { search: debouncedSearch }
  );

  const handleExport = () => {
    const data = items.map(i => ({
      'Invoice': i.invoiceNumber || 'N/A',
      'Student Name': i.studentId?.fullName || 'N/A',
      'Student Email': i.studentId?.email || 'N/A',
      'Course': i.courseId?.title || 'N/A',
      'Amount': `${i.currency || 'USD'} ${i.amount}`,
      'Status': i.status,
      'Date': new Date(i.createdAt).toLocaleDateString()
    }));
    downloadCSV(data, 'global_payments');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Finance</span>
          <h1 className="page-title">Global Payments</h1>
          <p className="page-subtitle">Track all payments across all organizations.</p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={handleExport} icon={Download}>Export CSV</Button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <Input
            placeholder="Search invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        <DataTable
          columns={[
            { key: 'invoiceNumber', header: 'Invoice', render: r => <span style={{ fontFamily: 'monospace' }}>{r.invoiceNumber || 'N/A'}</span> },
            { key: 'student', header: 'Student', render: r => r.studentId?.fullName || '—' },
            { key: 'course', header: 'Course', render: r => r.courseId?.title || '—' },
            { key: 'amount', header: 'Amount', render: r => <strong>{r.currency} {r.amount}</strong> },
            { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
            { key: 'createdAt', header: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() }
          ]}
          rows={items}
          loading={loading}
          pagination={{
            page,
            totalPages: meta.totalPages,
            totalItems: meta.totalItems,
            onPageChange: setPage
          }}
          emptyLabel="No payments found across any organization."
        />
      </div>
    </div>
  );
}
