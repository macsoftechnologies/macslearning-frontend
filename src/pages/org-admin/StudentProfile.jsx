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
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([studentsApi.getById(id), studentsApi.getEnrollments(id)]).then(([s, e]) => {
      if (s.status === 'fulfilled') setStudent(s.value.data?.data || null);
      if (e.status === 'fulfilled') setEnrollments(e.value.data?.data || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!student) return <div className="page"><p>Student not found.</p></div>;

  return (
    <div className="page">
      <Link to="/admin/students" className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to students
      </Link>

      <div className="page-head">
        <div>
          <span className="page-eyebrow">Student</span>
          <div className="row"><h1 className="page-title">{student.fullName}</h1><StatusBadge status={student.status || 'ACTIVE'} /></div>
          <p className="page-subtitle">{student.email}</p>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Contact Info</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Mobile" value={student.mobile || '—'} />
            <Row label="Registered On" value={student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'} />
          </div>
        </Card>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Summary</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Enrollments" value={enrollments.length} />
            <Row label="Status" value={student.status || 'ACTIVE'} />
          </div>
        </Card>
      </div>

      <p className="section-title">Enrollments</p>
      <DataTable
        columns={[
          { key: 'course', header: 'Course', render: (r) => r.courseId?.title || r.course?.title || r.courseTitle || '—' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'progress', header: 'Progress', render: (r) => `${r.progressPercentage ?? 0}%` },
          { key: 'enrolledAt', header: 'Enrolled On', render: (r) => (r.enrolledAt || r.createdAt ? new Date(r.enrolledAt || r.createdAt).toLocaleDateString() : '—') },
        ]}
        rows={enrollments}
        emptyLabel="No enrollments yet."
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
