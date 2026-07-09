import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as examsApi from '../../api/exams';
import DataTable from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import PageLoader from '../ui/PageLoader';

export default function StudentExams({ courseId }) {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [attemptsMap, setAttemptsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    examsApi.list(courseId)
      .then(async (res) => {
        const pub = (res.data?.data || []).filter(e => e.isPublished || e.status === 'PUBLISHED');
        setExams(pub);
        
        // Fetch attempts for all published exams
        const map = {};
        for (const exam of pub) {
          try {
            const attRes = await examsApi.attempts(exam._id || exam.id);
            const data = attRes.data?.data || attRes.data || [];
            map[exam._id || exam.id] = Array.isArray(data) ? data : [];
          } catch (e) {
            console.error('Failed to fetch attempts for exam', exam._id);
          }
        }
        setAttemptsMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: 'var(--sp-6)' }}>
      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 style={{ fontSize: 'var(--fs-lg)' }}>Exams</h2>
        <p className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>Complete these exams to pass the course.</p>
      </div>
      <DataTable
        emptyLabel="No exams available for this course yet."
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'duration', header: 'Duration', render: (r) => `${r.durationMinutes} min` },
          { key: 'marks', header: 'Total Marks', render: (r) => r.totalMarks },
          { key: 'passing', header: 'Passing (%)', render: (r) => `${r.passingPercentage}%` },
          { 
            key: 'attempts', 
            header: 'Attempts Used', 
            render: (r) => {
              const max = r.maxAttempts || 3;
              const used = (attemptsMap[r._id || r.id] || []).length;
              return `${used} / ${max}`;
            } 
          },
          {
            key: 'actions', header: 'Actions', render: (r) => {
              const pastAttempts = attemptsMap[r._id || r.id] || [];
              const max = r.maxAttempts || 3;
              const used = pastAttempts.length;
              
              return (
                <div className="row" style={{ gap: '8px' }}>
                  {used < max && (
                    <Button size="sm" onClick={() => navigate(`/student/my-courses/${courseId}/exams/${r._id || r.id}/take`)}>
                      Take Exam
                    </Button>
                  )}
                  {pastAttempts.map((att, idx) => (
                    <Button key={att._id} size="sm" variant="outline" onClick={() => navigate(`/student/my-courses/${courseId}/exams/${r._id || r.id}/attempts/${att._id}/review`)}>
                      Review Attempt {idx + 1}
                    </Button>
                  ))}
                </div>
              );
            },
          },
        ]}
        rows={exams}
      />
    </div>
  );
}
