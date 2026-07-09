import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import * as organizationsApi from '../../api/organizations';
import * as usersApi from '../../api/users';
import { extractErrorMessages } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageLoader from '../../components/ui/PageLoader';

export default function OrganizationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [org, setOrg] = useState(location.state?.org || null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(!location.state?.org);

  useEffect(() => {
    if (!org) {
      organizationsApi.list({ page: 1, limit: 100 }).then((res) => {
        const found = (res.data?.data || []).find((o) => (o._id || o.id) === id);
        setOrg(found || null);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
    // Fetch all users and filter client-side by organizationId since no org-scoped endpoint exists
    usersApi.list({ limit: 200 }).then((res) => {
      const allUsers = res.data?.data || [];
      setUsers(allUsers.filter((u) => u.organizationId === id));
    }).catch(() => {});
  }, [id, org]);

  const toggleStatus = async () => {
    const next = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await organizationsApi.updateStatus(org._id || org.id, next);
      setOrg((o) => ({ ...o, status: next }));
      toast.success(`Organization ${next.toLowerCase()}`);
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  if (loading) return <PageLoader />;
  if (!org) return <div className="page"><p>Organization not found.</p></div>;

  return (
    <div className="page">
      <Link to="/super-admin/organizations" className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to organizations
      </Link>

      <div className="page-head">
        <div>
          <span className="page-eyebrow">Organization</span>
          <div className="row">
            <h1 className="page-title">{org.name}</h1>
            <StatusBadge status={org.status} />
          </div>
        </div>
        <Button variant="outline" icon={Power} onClick={toggleStatus}>
          {org.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </Button>
      </div>

      <div className="form-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Organization Info</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Code" value={org.code} />
            <Row label="Slug" value={org.slug || '—'} />
            <Row label="Login URL" value={org.loginUrl || '—'} />
            <Row label="Contact Email" value={org.contactInfo?.email || '—'} />
            <Row label="Contact Phone" value={org.contactInfo?.phone || '—'} />
            <Row label="Address" value={org.contactInfo?.address || '—'} />
          </div>
        </Card>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Subscription</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Plan Type" value={org.subscriptionConfig?.planType || '—'} />
            <Row label="Billing Cycle" value={org.subscriptionConfig?.billingCycle || '—'} />
            <Row label="Max Students" value={org.subscriptionConfig?.maxStudents ?? '—'} />
            <Row label="Max Storage" value={org.subscriptionConfig?.maxStorageGB ? `${org.subscriptionConfig.maxStorageGB} GB` : '—'} />
            <Row label="Expires At" value={org.subscriptionConfig?.expiresAt ? new Date(org.subscriptionConfig.expiresAt).toLocaleDateString() : '—'} />
          </div>
        </Card>
      </div>

      <p className="section-title">Admin Users</p>
      <DataTable
        columns={[
          { key: 'fullName', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'userType', header: 'Role' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status || 'ACTIVE'} /> },
        ]}
        rows={users}
        emptyLabel="No users found for this organization."
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
      <span className="text-muted">{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
