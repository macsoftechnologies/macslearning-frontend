import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Library, Award, TrendingUp, PlayCircle } from 'lucide-react';
import { StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader from '../../components/ui/PageLoader';
import * as studentsApi from '../../api/students';
import { useAuth } from '../../contexts/AuthContext';
import { buildStaticUrl } from '../../api/client';
import './CourseGrid.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = user?.id || user?._id;
    if (!id) return;
    studentsApi.getEnrollments(id).then((res) => setEnrollments(res.data?.data || [])).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader />;

  const inProgress = enrollments.filter((e) => (e.progressPercentage ?? 0) < 100);
  const completed = enrollments.filter((e) => (e.progressPercentage ?? 0) >= 100);
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.progressPercentage || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Welcome back</span>
          <h1 className="page-title">Hi {user?.fullName?.split(' ')[0] || 'there'} 👋</h1>
          <p className="page-subtitle">Pick up where you left off.</p>
        </div>
        <Link to="/student/courses"><Button>Browse Courses</Button></Link>
      </div>

      <div className="grid-stats">
        <StatCard label="Enrolled Courses" value={enrollments.length} icon={Library} tone="ink" />
        <StatCard label="In Progress" value={inProgress.length} icon={PlayCircle} tone="amber" />
        <StatCard label="Completed" value={completed.length} icon={Award} tone="sage" />
        <StatCard label="Avg. Progress" value={`${avgProgress}%`} icon={TrendingUp} tone="sky" />
      </div>

      <h2 className="section-title">Continue Learning</h2>
      {inProgress.length === 0 ? (
        <EmptyState icon={Library} title="Nothing in progress" description="Enroll in a course to start your learning journey." action={<Link to="/student/courses"><Button size="sm">Browse Courses</Button></Link>} />
      ) : (
        <div className="course-grid">
          {inProgress.slice(0, 6).map((e) => (
            <Link to={`/student/my-courses/${e.courseId?._id || e.courseId?.id || e.courseId}/learn`} key={e._id || e.id} className="course-card">
              <div className="course-card__thumb" style={{ backgroundImage: e.courseId?.thumbnailUrl ? `url(${buildStaticUrl(e.courseId.thumbnailUrl)})` : undefined }}>
                {!e.courseId?.thumbnailUrl && <Library size={28} />}
              </div>
              <div className="course-card__body">
                <h3>{e.courseId?.title || 'Course'}</h3>
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
