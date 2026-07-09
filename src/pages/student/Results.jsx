import { useEffect, useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import * as resultsApi from '../../api/results';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader from '../../components/ui/PageLoader';
import Tabs from '../../components/ui/Tabs';
import { Link } from 'react-router-dom';

export default function Results() {
  const [results, setResults] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [videoQuizzes, setVideoQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('final');

  useEffect(() => {
    Promise.allSettled([
      resultsApi.myResults(),
      resultsApi.myAttempts(),
      resultsApi.myVideoQuizzes()
    ]).then(([res1, res2, res3]) => {
      if (res1.status === 'fulfilled') setResults(res1.value.data?.data || []);
      if (res2.status === 'fulfilled') setAttempts(res2.value.data?.data || []);
      if (res3.status === 'fulfilled') setVideoQuizzes(res3.value.data?.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="page-eyebrow">Performance</span>
          <h1 className="page-title">My Results</h1>
          <p className="page-subtitle">Your exam results and attempts across all your courses.</p>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <Tabs
          tabs={[
            { key: 'final', label: 'Final Results' },
            { key: 'attempts', label: 'Exam Attempts' },
            { key: 'video', label: 'Video Quizzes' }
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'final' && (
        results.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No final results yet" description="Your published exam results will appear here once available." />
        ) : (
          <DataTable
            columns={[
              { key: 'exam', header: 'Exam', render: (r) => r.exam?.title || r.examId?.title || '—' },
              { key: 'course', header: 'Course', render: (r) => r.course?.title || r.courseId?.title || '—' },
              { key: 'score', header: 'Score', render: (r) => `${r.marksObtained ?? 0} / ${r.totalMarks ?? '—'}` },
              { key: 'status', header: 'Result', render: (r) => <StatusBadge status={r.isPassed ? 'SUCCESS' : 'FAILED'} label={r.isPassed ? 'Passed' : 'Failed'} /> },
              { key: 'takenAt', header: 'Date', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
            ]}
            rows={results}
          />
        )
      )}

      {activeTab === 'attempts' && (
        attempts.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No exam attempts yet" description="Your attempt history will appear here." />
        ) : (
          <DataTable
            columns={[
              { key: 'exam', header: 'Exam', render: (r) => r.examId?.title || '—' },
              { key: 'attempt', header: 'Attempt #', render: (r) => r.attemptNumber },
              { key: 'score', header: 'Score', render: (r) => `${r.marksObtained ?? 0} / ${r.totalMarks ?? '—'}` },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'date', header: 'Date', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
              { key: 'actions', header: '', render: (r) => (
                <Link to={`/student/courses/${r.examId?.courseId}/exams/${r.examId?._id}/review/${r._id}`} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>
                  Review
                </Link>
              ) }
            ]}
            rows={attempts}
          />
        )
      )}

      {activeTab === 'video' && (
        videoQuizzes.length === 0 ? (
          <EmptyState icon={FileCheck2} title="No video quizzes answered" description="Your interactive video quiz scores will appear here." />
        ) : (
          <DataTable
            columns={[
              { key: 'lesson', header: 'Lesson', render: (r) => r.lessonId?.title || '—' },
              { key: 'question', header: 'Question', render: (r) => r.quizId?.questionText || '—' },
              { key: 'score', header: 'Score', render: (r) => `${r.marks ?? 0} / ${r.quizId?.maxMarks ?? '—'}` },
              { key: 'status', header: 'Status', render: (r) => (
                <StatusBadge 
                  status={r.isGraded ? (r.isCorrect ? 'SUCCESS' : 'FAILED') : 'PENDING'} 
                  label={r.isGraded ? (r.isCorrect ? 'Correct' : 'Incorrect') : 'Pending Review'} 
                />
              ) },
              { key: 'date', header: 'Date', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—') },
            ]}
            rows={videoQuizzes}
          />
        )
      )}
    </div>
  );
}
