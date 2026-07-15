import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, GraduationCap, BookOpen, CheckCircle2 } from 'lucide-react';
import { StatCard } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import PageLoader from '../../components/ui/PageLoader';

import * as organizationsApi from '../../api/organizations';
import * as plansApi from '../../api/subscriptionPlans';
import * as reportsApi from '../../api/reports';
import { useAuth } from '../../contexts/AuthContext';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasAccess = (perms) => {
    if (!user.permissions || user.permissions.length === 0) return true; // Root Admin
    return perms.some(p => user.permissions.includes(p));
  };

  const canSeeOrganizations = hasAccess(['TRACK_ORGANIZATIONS']);

  useEffect(() => {
    (async () => {
      const promises = [reportsApi.superAdminOverview()];
      
      if (canSeeOrganizations) {
        promises.push(organizationsApi.list({ page: 1, limit: 5 }));
        promises.push(plansApi.list());
      }

      const results = await Promise.allSettled(promises);
      
      if (results[0].status === 'fulfilled') setStats(results[0].value.data?.data || {});
      
      if (canSeeOrganizations) {
        if (results[1]?.status === 'fulfilled') setOrgs(results[1].value.data?.data || []);
        if (results[2]?.status === 'fulfilled') setPlans(results[2].value.data?.data || []);
      }
      
      setLoading(false);
    })();
  }, [canSeeOrganizations]);

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Overview</span>
          <h1 className="page-title">Platform Dashboard</h1>
          <p className="page-subtitle">A bird's-eye view of every organization on  LMS.</p>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard label="Total Organizations" value={stats?.totalOrganizations || 0} icon={Building2} tone="ink" />
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={GraduationCap} tone="brand" />
        <StatCard label="Total Courses" value={stats?.totalCourses || 0} icon={BookOpen} tone="sky" />
        <StatCard label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toLocaleString()}`} icon={CheckCircle2} tone="sage" />
      </div>

      {canSeeOrganizations && (
        <div className="stack" style={{ gap: 'var(--sp-8)' }}>
          <section>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Recent Organizations</h2>
              <Link to="/super-admin/organizations" className="text-muted" style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            <DataTable
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'code', header: 'Code' },
                { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'createdAt', header: 'Created', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
              ]}
              rows={orgs}
              emptyLabel="No organizations yet."
            />
          </section>

          <section>
            <h2 className="section-title">Subscription Plans</h2>
            <div className="grid-stats" style={{ marginBottom: 0 }}>
              {plans.length === 0 && <p className="text-muted">No plans configured yet.</p>}
              {plans.map((p) => (
                <div key={p._id || p.id} className="card" style={{ padding: 'var(--sp-4)' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>{p.name}</strong>
                    <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                  <p className="text-muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 6 }}>
                    {p.currency || 'USD'} {p.price} / {p.billingCycle}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
