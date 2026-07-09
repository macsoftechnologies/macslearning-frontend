import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import * as usersApi from '../../api/users';
import * as coursesApi from '../../api/courses';
import StatusBadge from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageLoader from '../../components/ui/PageLoader';

export default function FacultyProfile() {
  const { id } = useParams();
  const [faculty, setFaculty] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      usersApi.list({ limit: 200, userType: 'FACULTY' }),
      coursesApi.list({ limit: 100 }),
    ]).then(([u, c]) => {
      if (u.status === 'fulfilled') {
        const all = u.value.data?.data || [];
        // Only match FACULTY or ORG_USER roles
        setFaculty(all.find((x) => (x._id || x.id) === id && (x.userType === 'FACULTY' || x.userType === 'ORG_USER')) || null);
      }
      if (c.status === 'fulfilled') {
        const allCourses = c.value.data?.data || [];
        setCourses(allCourses.filter((course) => course.instructorIds?.some(i => i === id || i?._id === id || i?.id === id)));
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PageLoader />;
  if (!faculty) return <div className="page"><p>Faculty member not found.</p></div>;

  return (
    <div className="page">
      <Link to="/admin/faculty" className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to faculty
      </Link>

      <div className="page-head">
        <div>
          <span className="page-eyebrow">Faculty</span>
          <div className="row">
            <h1 className="page-title">{faculty.fullName}</h1>
            <StatusBadge status={faculty.status || 'ACTIVE'} />
          </div>
          <p className="page-subtitle">{faculty.email}</p>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 'var(--sp-8)' }}>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Contact Info</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Mobile" value={faculty.mobile || '—'} />
            <Row label="Joined" value={faculty.createdAt ? new Date(faculty.createdAt).toLocaleDateString() : '—'} />
            <Row label="Email Verified" value={faculty.emailVerified ? 'Yes' : 'No'} />
          </div>
        </Card>
        <Card style={{ padding: 'var(--sp-5)' }}>
          <p className="section-title">Summary</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Total Courses" value={courses.length} />
            <Row label="Role" value={faculty.userType || 'FACULTY'} />
            <Row label="Status" value={faculty.status || 'ACTIVE'} />
          </div>
        </Card>
      </div>

      <p className="section-title">Assigned Courses</p>
      <DataTable
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'price', header: 'Price', render: (r) => r.pricing?.isPaid ? `${r.pricing.currency || 'USD'} ${r.pricing.amount}` : 'Free' },
          { key: 'createdAt', header: 'Created', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
        ]}
        rows={courses}
        emptyLabel="No courses assigned to this faculty member."
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

