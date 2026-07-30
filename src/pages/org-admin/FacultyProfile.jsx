import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as usersApi from '../../api/users';
import StatusBadge from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageLoader from '../../components/ui/PageLoader';

export default function FacultyProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    usersApi.getFacultyDetails(id)
      .then((res) => {
        setData(res.data?.data || res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!data || !data.profile) return <div className="page"><p>Faculty member not found.</p></div>;

  const { profile, courses, stats } = data;

  return (
    <div className="page">
      <Link to="/admin/faculty" className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to faculty
      </Link>

      <div className="page-head">
        <div>
          <span className="page-eyebrow">Faculty</span>
          <div className="row">
            <h1 className="page-title">{profile.fullName}</h1>
            <StatusBadge status={profile.status || 'ACTIVE'} />
          </div>
          <p className="page-subtitle">{profile.email}</p>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Contact Info</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Mobile" value={profile.mobile || '—'} />
            <Row label="Joined" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'} />
            <Row label="Email Verified" value={profile.emailVerified ? 'Yes' : 'No'} />
          </div>
        </Card>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Summary Stats</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Total Courses" value={stats.totalCourses} />
            <Row label="Total Students" value={stats.totalStudents} />
            <Row label="Status" value={profile.status || 'ACTIVE'} />
          </div>
        </Card>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 'var(--sp-4)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--sp-5)' }}>
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          style={{ padding: 'var(--sp-2) 0', borderBottom: activeTab === 'courses' ? '2px solid var(--color-primary-600)' : 'none', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'courses' ? 'var(--color-primary-600)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('courses')}
        >
          Courses & Students
        </button>
      </div>

      {activeTab === 'courses' && (
        <>
          <p className="section-title">Assigned Courses</p>
          <DataTable
            columns={[
              { key: 'title', header: 'Course Title' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'studentCount', header: 'Enrolled Students' },
              { key: 'createdAt', header: 'Created', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
            ]}
            rows={courses || []}
            emptyLabel="No courses assigned to this faculty member."
          />
        </>
      )}
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

