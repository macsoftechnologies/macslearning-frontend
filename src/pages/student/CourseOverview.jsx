import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, BarChart2, User, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as coursesApi from '../../api/courses';
import * as contentApi from '../../api/content';
import * as enrollmentsApi from '../../api/enrollments';
import * as studentsApi from '../../api/students';
import { useAuth } from '../../contexts/AuthContext';
import { extractErrorMessages, buildStaticUrl } from '../../api/client';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import PageLoader from '../../components/ui/PageLoader';

export default function CourseOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      coursesApi.getById(id), 
      contentApi.listModules(id).catch(() => ({ data: { data: [] } }))
    ]).then(([c, m]) => {
      if (c.status === 'fulfilled') setCourse(c.value.data?.data || null);
      if (m.status === 'fulfilled') setModules(m.value?.data?.data || []);
      
      const userId = user?.id || user?._id;
      if (userId) {
        studentsApi.getEnrollments(userId).then((eRes) => {
          const enrollmentsList = eRes.data?.data || [];
          const enrolled = enrollmentsList.some(e => (e.courseId?._id || e.courseId?.id || e.courseId) === id);
          setIsEnrolled(enrolled);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [id, user]);

  const enroll = async () => {
    setEnrolling(true);
    try {
      await enrollmentsApi.studentEnroll(id);
      toast.success('Enrolled successfully!');
      navigate(`/student/my-courses/${id}/learn`);
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!course) return <div className="page"><p>Course not found.</p></div>;

  return (
    <div className="page">
      <Link to="/student/courses" className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to catalog
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--sp-8)' }}>
        <div>
          <span className="page-eyebrow">{course.category?.name || 'Course'}</span>
          <h1 className="page-title" style={{ marginBottom: 'var(--sp-3)' }}>{course.title}</h1>
          <p className="text-muted" style={{ marginBottom: 'var(--sp-5)', lineHeight: 1.6 }}>{course.description || 'No description provided.'}</p>

          <div className="row" style={{ gap: 'var(--sp-6)', marginBottom: 'var(--sp-8)', flexWrap: 'wrap' }}>
            <span className="row text-muted" style={{ fontSize: 'var(--fs-sm)' }}><User size={15} /> {course.faculty?.fullName || 'Ledger LMS'}</span>
            <span className="row text-muted" style={{ fontSize: 'var(--fs-sm)' }}><Clock size={15} /> {course.durationWeeks ? `${course.durationWeeks} weeks` : 'Self-paced'}</span>
            <span className="row text-muted" style={{ fontSize: 'var(--fs-sm)' }}><BarChart2 size={15} /> {course.level || 'All levels'}</span>
          </div>

          <h2 className="section-title">Syllabus</h2>
          <div className="stack">
            {modules.length === 0 ? (
              <p className="text-muted">Enroll to view the full syllabus.</p>
            ) : (
              modules.map((m, i) => (
                <Card key={m.id || m._id} style={{ padding: 'var(--sp-4)' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>{i + 1}. {m.title}</strong>
                  </div>
                  {m.description && <p className="text-muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 6 }}>{m.description}</p>}
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <Card style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 90 }}>
            <div style={{ height: 160, background: course.thumbnailUrl ? `url(${buildStaticUrl(course.thumbnailUrl)}) center/cover` : 'linear-gradient(135deg, var(--color-ink-800), var(--color-ink-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-amber-400)' }}>
              {!course.thumbnailUrl && <PlayCircle size={36} />}
            </div>
            <div style={{ padding: 'var(--sp-5)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', margin: '0 0 var(--sp-4) 0' }}>
                {(() => {
                  if (!course.pricing?.isPaid) return 'Free';
                  let displayPrice = course.pricing.amount;
                  if (user?.regionId && course.regionalPrices?.length > 0) {
                    const rp = course.regionalPrices.find(
                      (p) => p.regionId?._id === user.regionId || p.regionId === user.regionId
                    );
                    if (rp) displayPrice = rp.price;
                  }
                  return `$${displayPrice}`;
                })()}
              </p>
              {isEnrolled ? (
                <Button full size="lg" onClick={() => navigate(`/student/my-courses/${id}/learn`)}>Go to Course</Button>
              ) : (
                <Button full size="lg" onClick={enroll} loading={enrolling}>
                  {course.pricing?.isPaid ? 'Buy now' : 'Enroll Now'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
