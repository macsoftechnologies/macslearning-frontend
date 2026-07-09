import { Link } from 'react-router-dom';
import { Library } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as studentsApi from '../../api/students';
import { useAuth } from '../../contexts/AuthContext';
import { buildStaticUrl } from '../../api/client';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader from '../../components/ui/PageLoader';
import Button from '../../components/ui/Button';
import './CourseGrid.css';

export default function MyCourses() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = user?.id || user?._id;
    if (!id) return;
    studentsApi.getEnrollments(id).then((res) => setEnrollments(res.data?.data || [])).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Learning</span>
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Everything you're enrolled in.</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState icon={Library} title="No courses yet" description="Browse the catalog and enroll in your first course." action={<Link to="/student/courses"><Button size="sm">Browse Courses</Button></Link>} />
      ) : (
        <div className="course-grid">
          {enrollments.map((e) => (
            <Link to={e.status === 'EXPIRED' ? '#' : `/student/my-courses/${e.courseId?._id || e.courseId?.id || e.courseId}/learn`} key={e._id || e.id} className="course-card" style={e.status === 'EXPIRED' ? { opacity: 0.7 } : {}}>
              <div className="course-card__thumb" style={{ backgroundImage: e.courseId?.thumbnailUrl ? `url(${buildStaticUrl(e.courseId.thumbnailUrl)})` : undefined, position: 'relative' }}>
                {!e.courseId?.thumbnailUrl && <Library size={28} />}
                {e.status === 'EXPIRED' && <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: 'var(--fs-xs)', fontWeight: 'bold' }}>Expired</span>}
              </div>
              <div className="course-card__body">
                <h3>{e.courseId?.title || 'Course'}</h3>
                {e.expiresAt && <p className="text-muted" style={{ fontSize: 'var(--fs-xs)', marginBottom: 'var(--sp-2)' }}>Expires: {new Date(e.expiresAt).toLocaleDateString()}</p>}
                <div className="course-card__progress">
                  <div className="course-card__progress-bar"><span style={{ width: `${e.progressPercentage || 0}%` }} /></div>
                  <span className="text-muted" style={{ fontSize: 'var(--fs-2xs)' }}>{e.progressPercentage || 0}% complete</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
