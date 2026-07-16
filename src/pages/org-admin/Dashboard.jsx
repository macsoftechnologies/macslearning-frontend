import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Clock, BookOpen, Users, ClipboardList, Wallet, UserPlus, Plus, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import * as reportsApi from '../../api/reports';
import * as studentsApi from '../../api/students';
import * as coursesApi from '../../api/courses';
import * as categoriesApi from '../../api/categories';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [loading, setLoading] = useState(true);

  const orgSlug = user?.organizationSlug || user?.organizationCode || localStorage.getItem('orgSlug') || '';
  const baseUrl = window.location.origin + '/macslearnfrontend';
  const loginUrl = `${baseUrl}/${orgSlug}/login`;
  const registerUrl = `${baseUrl}/${orgSlug}/register`;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} URL copied to clipboard!`);
  };

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        reportsApi.overview(),
        studentsApi.listPending({ page: 1, limit: 5 }),
        coursesApi.list({ page: 1, limit: 5 }),
        categoriesApi.list({ limit: 200 }),
      ]);
      if (results[0].status === 'fulfilled') setStats(results[0].value.data?.data || {});
      if (results[1].status === 'fulfilled') setPending(results[1].value.data?.data || []);
      if (results[2].status === 'fulfilled') setRecentCourses(results[2].value.data?.data || []);
      if (results[3].status === 'fulfilled') {
        const map = {};
        (results[3].value.data?.data || []).forEach((c) => { map[c._id || c.id] = c.name; });
        setCatMap(map);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Overview</span>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Everything happening in your organization, at a glance.</p>
        </div>
        <div className="row">
          <Link to="/admin/students"><Button variant="outline" icon={UserPlus} size="sm">Add Student</Button></Link>
          <Link to="/admin/faculty"><Button variant="outline" icon={UserPlus} size="sm">Add Faculty</Button></Link>
          <Link to="/admin/courses/create"><Button icon={Plus} size="sm">Create Course</Button></Link>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard label="Total Students" value={stats?.totalStudents ?? '—'} icon={GraduationCap} tone="ink" />
        <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? pending.length} icon={Clock} tone="amber" />
        <StatCard label="Active Courses" value={stats?.activeCourses ?? '—'} icon={BookOpen} tone="sky" />
        <StatCard label="Total Faculty" value={stats?.totalFaculty ?? '—'} icon={Users} tone="sage" />
        <StatCard label="Total Enrollments" value={stats?.totalEnrollments ?? '—'} icon={ClipboardList} tone="ink" />
        <StatCard label="Revenue" value={stats?.revenue != null ? `$${stats.revenue}` : '—'} icon={Wallet} tone="amber" />
      </div>

      <div className="card" style={{ marginBottom: 'var(--sp-8)', padding: '20px' }}>
        <h3 style={{ margin: '0 0 var(--sp-4) 0', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>Quick Share Links</h3>
        <div className="stack" style={{ gap: 'var(--sp-4)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-muted)' }}>Student Registration URL</label>
              <div style={{ padding: '8px 12px', background: 'var(--c-bg-subtle)', borderRadius: 'var(--r-md)', fontSize: '13px', fontFamily: 'monospace', color: 'var(--c-text)', wordBreak: 'break-all' }}>
                {registerUrl}
              </div>
            </div>
            <Button variant="outline" size="sm" icon={Copy} onClick={() => copyToClipboard(registerUrl, 'Registration')}>Copy</Button>
          </div>
          <div className="row" style={{ alignItems: 'center', gap: 'var(--sp-4)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-muted)' }}>Organization Login URL</label>
              <div style={{ padding: '8px 12px', background: 'var(--c-bg-subtle)', borderRadius: 'var(--r-md)', fontSize: '13px', fontFamily: 'monospace', color: 'var(--c-text)', wordBreak: 'break-all' }}>
                {loginUrl}
              </div>
            </div>
            <Button variant="outline" size="sm" icon={Copy} onClick={() => copyToClipboard(loginUrl, 'Login')}>Copy</Button>
          </div>
        </div>
      </div >

      <div className="stack" style={{ gap: 'var(--sp-8)' }}>
        <section>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Pending Students</h2>
            <Link to="/admin/students" className="text-muted" style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>Review all →</Link>
          </div>
          <DataTable
            columns={[
              { key: 'fullName', header: 'Full Name' },
              { key: 'email', header: 'Email' },
              { key: 'mobile', header: 'Mobile', render: (r) => r.mobile || '—' },
              { key: 'createdAt', header: 'Registered On', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
            ]}
            rows={pending}
            emptyLabel="No pending approvals. You're all caught up."
          />
        </section>

        <section>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Recent Courses</h2>
            <Link to="/admin/courses" className="text-muted" style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>View all →</Link>
          </div>
          <DataTable
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'category', header: 'Category', render: (r) => r.category?.name || catMap[r.categoryId] || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'price', header: 'Price', render: (r) => r.pricing?.isPaid ? `${r.pricing.currency || 'USD'} ${r.pricing.amount}` : r.price ? `$${r.price}` : 'Free' },
              { key: 'enrolledCount', header: 'Enrolled', render: (r) => r.enrolledCount ?? 0 },
            ]}
            rows={recentCourses}
            emptyLabel="No courses created yet."
          />
        </section>
      </div>
    </div >
  );
}
