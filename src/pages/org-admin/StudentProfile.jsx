import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as studentsApi from '../../api/students';
import StatusBadge from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageLoader from '../../components/ui/PageLoader';

export default function StudentProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrollments');

  useEffect(() => {
    studentsApi.getStudentDetails(id)
      .then((res) => {
        setData(res.data?.data || res.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!data || !data.profile) return <div className="page"><p>Student not found.</p></div>;

  const { profile, enrollments, examResults, stats } = data;

  return (
    <div className="page">
      <Link to=".." className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to students
      </Link>

      <div className="page-head">
        <div>
          <span className="page-eyebrow">Student Profile</span>
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
            <Row label="Registered On" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'} />
          </div>
        </Card>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Summary Stats</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Total Enrollments" value={stats.totalCourses} />
            <Row label="Exams Attempted" value={stats.totalExamsAttempted} />
            <Row label="Status" value={profile.status || 'ACTIVE'} />
          </div>
        </Card>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 'var(--sp-4)', borderBottom: '1px solid var(--border)', marginBottom: 'var(--sp-5)' }}>
        <button 
          className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
          style={{ padding: 'var(--sp-2) 0', borderBottom: activeTab === 'enrollments' ? '2px solid var(--color-primary-600)' : 'none', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'enrollments' ? 'var(--color-primary-600)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('enrollments')}
        >
          Enrollments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          style={{ padding: 'var(--sp-2) 0', borderBottom: activeTab === 'exams' ? '2px solid var(--color-primary-600)' : 'none', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'exams' ? 'var(--color-primary-600)' : 'var(--text-muted)' }}
          onClick={() => setActiveTab('exams')}
        >
          Exam Results
        </button>
      </div>

      {activeTab === 'enrollments' && (
        <>
          <p className="section-title">Enrollments</p>
          <DataTable
            columns={[
              { key: 'course', header: 'Course', render: (r) => r.course?.title || r.courseTitle || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'progress', header: 'Progress', render: (r) => `${r.progressPercentage ?? 0}%` },
              { key: 'enrolledAt', header: 'Enrolled On', render: (r) => (r.enrolledAt || r.createdAt ? new Date(r.enrolledAt || r.createdAt).toLocaleDateString() : '—') },
            ]}
            rows={enrollments || []}
            emptyLabel="No enrollments."
          />
        </>
      )}

      {activeTab === 'exams' && (
        <>
          <p className="section-title">Exam Results</p>
          <DataTable
            columns={[
              { key: 'exam', header: 'Exam', render: (r) => r.exam?.title || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'score', header: 'Score', render: (r) => r.score !== undefined && r.score !== null ? `${r.score} / ${r.exam?.totalMarks || 100}` : '—' },
              { key: 'submitted', header: 'Submitted', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
            ]}
            rows={examResults || []}
            emptyLabel="No exams attempted."
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
