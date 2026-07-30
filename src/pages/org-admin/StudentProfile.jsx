import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, FileText, ChevronDown, ChevronUp, PlayCircle, FileSignature } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import * as studentsApi from '../../api/students';
import StatusBadge from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageLoader from '../../components/ui/PageLoader';

const PROGRESS_COLORS = ['url(#colorProgress)', '#f1f5f9']; 
const SCORE_COLORS = ['url(#colorPass)', 'url(#colorFail)', '#f1f5f9'];

export default function StudentProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

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

  const toggleCourse = (courseId) => {
    setExpandedCourseId(prev => prev === courseId ? null : courseId);
  };

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

      <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, marginBottom: 'var(--sp-5)' }}>Enrolled Courses</h2>

      {(!enrollments || enrollments.length === 0) ? (
        <Card style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={32} style={{ margin: '0 auto var(--sp-4)', opacity: 0.5 }} />
          <p>No courses enrolled yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--sp-5)', alignItems: 'start' }}>
          {enrollments.map(enrollment => {
            const courseExams = (examResults || []).filter(e => e.exam?.courseId === enrollment.courseId);
            const progress = enrollment.progressPercentage || 0;
            const progressData = [
              { name: 'Completed', value: progress },
              { name: 'Remaining', value: 100 - progress }
            ];
            const isExpanded = expandedCourseId === enrollment.id;

            return (
              <Card 
                key={enrollment.id} 
                style={{ 
                  overflow: 'hidden', 
                  gridColumn: isExpanded ? '1 / -1' : 'auto',
                  transition: 'all 0.2s ease-in-out',
                  border: isExpanded ? '2px solid var(--color-primary-500)' : '1px solid var(--border)',
                  cursor: 'pointer'
                }}
                onClick={() => !isExpanded && toggleCourse(enrollment.id)}
              >
                {/* CARD HEADER (Always Visible) */}
                <div style={{ padding: 'var(--sp-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 'var(--sp-2)', color: isExpanded ? 'var(--color-primary-700)' : 'inherit' }}>
                      {enrollment.courseTitle || enrollment.course?.title || 'Unknown Course'}
                    </h3>
                    <div className="row text-muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--sp-3)' }}>
                      <span className="row"><Clock size={12} style={{ marginRight: 4 }} /> {new Date(enrollment.createdAt).toLocaleDateString()}</span>
                      <StatusBadge status={enrollment.status} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    {!isExpanded && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--color-primary-600)' }}>{progress}%</p>
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleCourse(enrollment.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED CONTENT */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    
                    {/* Infographic Section */}
                    <div style={{ padding: 'var(--sp-6)', display: 'flex', gap: 'var(--sp-8)', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc' }}>
                      <div style={{ width: 160, height: 160, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              <linearGradient id="colorProgress" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={1}/>
                              </linearGradient>
                            </defs>
                            <Pie
                              data={progressData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={0}
                              dataKey="value"
                              stroke="none"
                              cornerRadius={progress > 0 ? 10 : 0}
                            >
                              {progressData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PROGRESS_COLORS[index]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Progress</span>
                          <span style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{progress}%</span>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 200 }}>
                        <h4 style={{ fontSize: 'var(--fs-md)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Course Insights</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-4)' }}>
                          This student has completed {progress}% of the required material.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
                          <div style={{ padding: 'var(--sp-3)', backgroundColor: 'white', borderRadius: 8, border: '1px solid var(--border)', flex: 1 }}>
                            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Highest Score</p>
                            <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>{Math.max(0, ...courseExams.map(e => e.score || 0))}</p>
                          </div>
                          <div style={{ padding: 'var(--sp-3)', backgroundColor: 'white', borderRadius: 8, border: '1px solid var(--border)', flex: 1 }}>
                            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Exams Passed</p>
                            <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>{courseExams.filter(e => e.isPassed).length}</p>
                          </div>
                        </div>
                        
                        {enrollment.curriculum && (
                          <div>
                            <h5 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Curriculum Breakdown</h5>
                            <div className="stack" style={{ gap: 'var(--sp-2)' }}>
                              <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                                <span className="row" style={{ color: 'var(--text-muted)' }}><PlayCircle size={14} style={{ marginRight: 6, color: '#3b82f6' }} /> Videos Watched</span>
                                <span style={{ fontWeight: 600 }}>{enrollment.curriculum.videos.completed} / {enrollment.curriculum.videos.total}</span>
                              </div>
                              <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                                <span className="row" style={{ color: 'var(--text-muted)' }}><FileText size={14} style={{ marginRight: 6, color: '#f59e0b' }} /> Exams Attempted</span>
                                <span style={{ fontWeight: 600 }}>{enrollment.curriculum.exams.completed} / {enrollment.curriculum.exams.total}</span>
                              </div>
                              <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                                <span className="row" style={{ color: 'var(--text-muted)' }}><FileSignature size={14} style={{ marginRight: 6, color: '#10b981' }} /> Assignments Submitted</span>
                                <span style={{ fontWeight: 600 }}>{enrollment.curriculum.assignments.completed} / {enrollment.curriculum.assignments.total}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tables Section */}
                    <div style={{ padding: 'var(--sp-5)' }}>
                      <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-4)' }} className="row">
                        <FileText size={14} style={{ marginRight: 6 }} /> Detailed Exam History
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
                                    <div style={{ width: 50, height: 50, position: 'relative' }}>
                                      <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                          <defs>
                                            <linearGradient id="colorPass" x1="0" y1="0" x2="1" y2="1">
                                              <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                                              <stop offset="95%" stopColor="#34d399" stopOpacity={1}/>
                                            </linearGradient>
                                            <linearGradient id="colorFail" x1="0" y1="0" x2="1" y2="1">
                                              <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                                              <stop offset="95%" stopColor="#fb7185" stopOpacity={1}/>
                                            </linearGradient>
                                          </defs>
                                          <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={16}
                                            outerRadius={24}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={score > 0 ? 10 : 0}
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
                  </div>
                )}
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

