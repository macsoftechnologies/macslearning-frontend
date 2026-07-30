import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import * as studentsApi from '../../api/students';
import StatusBadge from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageLoader from '../../components/ui/PageLoader';

const PROGRESS_COLORS = ['#8b5cf6', '#f1f5f9']; // Vibrant Purple, Light Gray
const SCORE_COLORS = ['#f59e0b', '#f43f5e', '#f1f5f9']; // Amber for pass, Rose for fail, Light Gray for remaining

export default function StudentProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <p className="section-title">Academic Summary</p>
          <div className="stack" style={{ gap: 8 }}>
            <Row label="Enrolled Courses" value={stats.totalCourses} />
            <Row label="Exams Taken" value={stats.totalExamsAttempted} />
            <Row label="Account Status" value={profile.status || 'ACTIVE'} />
          </div>
        </Card>
      </div>

      <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, marginBottom: 'var(--sp-5)' }}>Course Performance</h2>

      {(!enrollments || enrollments.length === 0) ? (
        <Card style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={32} style={{ margin: '0 auto var(--sp-4)', opacity: 0.5 }} />
          <p>No courses enrolled yet.</p>
        </Card>
      ) : (
        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          {enrollments.map(enrollment => {
            const courseExams = (examResults || []).filter(e => e.exam?.courseId === enrollment.courseId);
            const progress = enrollment.progressPercentage || 0;
            const progressData = [
              { name: 'Completed', value: progress },
              { name: 'Remaining', value: 100 - progress }
            ];

            return (
              <Card key={enrollment.id} style={{ overflow: 'hidden' }}>
                <div style={{ padding: 'var(--sp-5)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--sp-5)' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>
                      {enrollment.courseTitle || enrollment.course?.title || 'Unknown Course'}
                    </h3>
                    <div className="row text-muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--sp-4)' }}>
                      <span className="row"><Clock size={14} style={{ marginRight: 4 }} /> Enrolled: {new Date(enrollment.createdAt).toLocaleDateString()}</span>
                      <StatusBadge status={enrollment.status} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Course Progress</p>
                    </div>
                    <div style={{ width: 120, height: 120, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={progressData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                          >
                            {progressData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PROGRESS_COLORS[index]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                        <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: '#334155' }}>{progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 'var(--sp-5)', background: 'var(--bg-muted)' }}>
                  <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-4)' }} className="row">
                    <FileText size={14} style={{ marginRight: 6 }} /> Exam Attempts for this Course
                  </h4>
                  {courseExams.length > 0 ? (
                    <DataTable
                      columns={[
                        { key: 'exam', header: 'Exam Name', render: (r) => (
                          <div>
                            <span style={{ fontWeight: 500 }}>{r.exam?.title || '—'}</span>
                            {r.exam?.isFinalExam && <StatusBadge status="FINAL" style={{ marginLeft: 8 }} />}
                          </div>
                        )},
                        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                        { key: 'score', header: 'Score', render: (r) => {
                          const max = r.exam?.totalMarks || 100;
                          const score = r.score ?? 0;
                          const pass = r.isPassed;
                          const chartData = [
                            { name: 'Score', value: score },
                            { name: 'Lost', value: Math.max(0, max - score) }
                          ];
                          return (
                            <div className="row" style={{ gap: 'var(--sp-3)' }}>
                              <span style={{ fontWeight: 600, fontSize: 'var(--fs-md)', color: pass ? '#10b981' : (r.status === 'SUBMITTED' ? '#ef4444' : 'inherit') }}>
                                {r.status === 'SUBMITTED' ? `${score}/${max}` : '—'}
                              </span>
                              {r.status === 'SUBMITTED' && (
                                <div style={{ width: 40, height: 40 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={12}
                                        outerRadius={18}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={2}
                                      >
                                        <Cell fill={pass ? SCORE_COLORS[0] : SCORE_COLORS[1]} />
                                        <Cell fill={SCORE_COLORS[2]} />
                                      </Pie>
                                      <Tooltip />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          )
                        }},
                        { key: 'submitted', header: 'Submitted', render: (r) => r.status === 'SUBMITTED' && r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
                      ]}
                      rows={courseExams}
                      emptyLabel="No exams attempted."
                    />
                  ) : (
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>No exams attempted for this course yet.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
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

