import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Pencil, Trash2, FileText, Video, HelpCircle, Users, ClipboardList, FileCheck2, MessagesSquare, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as coursesApi from '../../api/courses';
import * as contentApi from '../../api/content';
import * as usersApi from '../../api/users';
import * as regionsApi from '../../api/regions';
import * as assignmentsApi from '../../api/assignments';
import * as examsApi from '../../api/exams';
import * as discussionApi from '../../api/discussion';
import { extractErrorMessages, buildStaticUrl } from '../../api/client';
import StatusBadge from '../../components/ui/StatusBadge';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Input, { Field, Textarea, Select } from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageLoader from '../../components/ui/PageLoader';
import FileUploader from '../../components/ui/FileUploader';
import ThreadDetailModal from '../../components/discussion/ThreadDetailModal';
import CourseDiscussionSidebar from '../../components/course/CourseDiscussionSidebar';

const basePathFor = (pathname) => (pathname.startsWith('/faculty') ? '/faculty' : '/admin');

export default function CourseDetail() {
  const { id } = useParams();
  const location = useLocation();
  const base = basePathFor(location.pathname);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('content');
  const [viewPricing, setViewPricing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facultyMap, setFacultyMap] = useState({});
  const [regionMap, setRegionMap] = useState({});


  const load = () => {
    coursesApi.getById(id).then((res) => setCourse(res.data?.data || null)).finally(() => setLoading(false));
    
    usersApi.list({ userType: 'FACULTY', limit: 500 }).then((res) => {
      const map = {};
      (res.data?.data || res.data || []).forEach(u => { map[u._id || u.id] = u.fullName || u.email; });
      setFacultyMap(map);
    }).catch(() => {});
    
    regionsApi.list({ localOnly: true }).then((res) => {
      setRegions(res.data?.data || []);
      const map = {};
      (res.data?.data || res.data || []).forEach(r => { map[r._id || r.id] = r.name; });
      setRegionMap(map);
    }).catch(() => {});
  };

  useEffect(load, [id]);

  const publishCourse = async () => {
    try {
      await coursesApi.updateStatus(id, 'PUBLISHED');
      toast.success('Course published successfully!');
      load();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  if (loading) return <PageLoader />;
  if (!course) return <div className="page"><p>Course not found.</p></div>;

  return (
    <div className="page">
      <Link to={`${base}/courses`} className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to courses
      </Link>

      <div className="page-head">
        <div>
          <span className="page-eyebrow">{course.category?.name || 'Course'}</span>
          <div className="row"><h1 className="page-title">{course.title}</h1><StatusBadge status={course.status} /></div>
          <p className="page-subtitle">
            {course.faculty?.fullName ? `Taught by ${course.faculty.fullName}` : 
             course.instructor?.fullName ? `Taught by ${course.instructor.fullName}` : 
             (course.instructorIds?.length > 0 ? `Taught by ${course.instructorIds.map(i => typeof i === 'object' ? i.fullName : facultyMap[i] || i).join(', ')}` : '')}
          </p>
          <div className="row" style={{ marginTop: '12px', gap: '8px', fontSize: 'var(--fs-sm)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-primary-700)', padding: '2px 8px', background: 'var(--color-primary-50)', borderRadius: '4px' }}>
              {course.pricing?.isPaid ? `${course.pricing.currency || 'USD'} ${course.pricing.amount}` : course.price ? `$${course.price}` : 'Free'}
            </span>
            {course.regionalPrices?.length > 0 && (
              <span 
                className="text-muted" 
                style={{ fontSize: 'var(--fs-xs)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setViewPricing(true)}
              >
                (+{course.regionalPrices.length} Regional Prices)
              </span>
            )}
          </div>
        </div>
        <div className="row">
          {course.status !== 'PUBLISHED' && (
            <Button variant="outline" icon={CheckCircle2} onClick={publishCourse}>Publish Course</Button>
          )}
          {base === '/admin' && (
            <Link to={`${base}/courses/${id}/edit`}><Button variant="outline" icon={Pencil}>Edit Details</Button></Link>
          )}
          <Button variant="outline" icon={MessagesSquare} onClick={() => setSidebarOpen(true)}>Course Chat</Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'content', label: 'Content' },
          { key: 'students', label: 'Students', icon: Users },
          { key: 'assignments', label: 'Assignments', icon: ClipboardList },
          { key: 'exams', label: 'Exams', icon: FileCheck2 },
          { key: 'discussions', label: 'Discussions', icon: MessagesSquare },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'content' && <ContentTab courseId={id} base={base} />}
      {tab === 'students' && <StudentsTab courseId={id} />}
      {tab === 'assignments' && <AssignmentsTab courseId={id} base={base} />}
      {tab === 'exams' && <ExamsTab courseId={id} base={base} />}
      {tab === 'discussions' && <DiscussionsTab courseId={id} base={base} />}

      <Modal open={viewPricing} onClose={() => setViewPricing(false)} title="Regional Pricing" width={400}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>{course?.title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
            Base Price: {course?.pricing?.isPaid ? `${course.pricing.currency || 'USD'} ${course.pricing.amount}` : course?.price ? `$${course.price}` : 'Free'}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              <th style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)' }}>Region</th>
              <th style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)', textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {(course?.regionalPrices || []).map((rp, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)' }}>{rp.regionId?.name || regionMap[rp.regionId] || 'Unknown'}</td>
                <td style={{ padding: '8px 4px', fontSize: 'var(--fs-sm)', textAlign: 'right' }}>{course?.pricing?.currency || 'USD'} {rp.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-panel__foot" style={{ margin: '24px -24px -24px', padding: '16px 24px', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setViewPricing(false)}>Close</Button>
        </div>
      </Modal>

      <CourseDiscussionSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} courseId={id} />
    </div>
  );
}

/* ---------------------------- Content Tab ---------------------------- */

function ContentTab({ courseId, base }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [lessonsByModule, setLessonsByModule] = useState({});
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonModal, setLessonModal] = useState(null); // moduleId
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', type: 'VIDEO', videoUrl: '', content: '', contentUrl: '', durationMinutes: '' });
  const [deleteModuleTarget, setDeleteModuleTarget] = useState(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadModules = () => {
    setLoading(true);
    contentApi.listModules(courseId).then((res) => setModules(res.data?.data || [])).finally(() => setLoading(false));
  };
  useEffect(loadModules, [courseId]);

  const toggleExpand = async (moduleId) => {
    setExpanded((e) => ({ ...e, [moduleId]: !e[moduleId] }));
    if (!lessonsByModule[moduleId]) {
      const res = await contentApi.listLessons(courseId, moduleId).catch(() => null);
      setLessonsByModule((prev) => ({ ...prev, [moduleId]: res?.data?.data || [] }));
    }
  };

  const submitModule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await contentApi.createModule(courseId, moduleForm);
      toast.success('Module added');
      setModuleModal(false);
      setModuleForm({ title: '', description: '' });
      loadModules();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  const submitLesson = async (e) => {
    e.preventDefault();
    setSaving(true);
    const modId = lessonModal?.moduleId;
    const lesId = lessonModal?.lessonId;
    try {
      const payload = {
        ...lessonForm,
        durationMinutes: lessonForm.durationMinutes ? Number(lessonForm.durationMinutes) : undefined,
      };
      if (lesId) {
        await contentApi.updateLesson(courseId, modId, lesId, payload);
        toast.success('Lesson updated');
      } else {
        await contentApi.createLesson(courseId, modId, payload);
        toast.success('Lesson added');
      }
      const res = await contentApi.listLessons(courseId, modId);
      setLessonsByModule((prev) => ({ ...prev, [modId]: res.data?.data || [] }));
      setLessonModal(null);
      setLessonForm({ title: '', description: '', type: 'VIDEO', videoUrl: '', content: '', contentUrl: '', durationMinutes: '' });
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  const doDeleteModule = async () => {
    try {
      await contentApi.deleteModule(courseId, deleteModuleTarget._id || deleteModuleTarget.id);
      toast.success('Module deleted');
      setDeleteModuleTarget(null);
      loadModules();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  const doDeleteLesson = async () => {
    try {
      await contentApi.deleteLesson(courseId, deleteLessonTarget.moduleId, deleteLessonTarget._id || deleteLessonTarget.id);
      toast.success('Lesson deleted');
      const res = await contentApi.listLessons(courseId, deleteLessonTarget.moduleId);
      setLessonsByModule((prev) => ({ ...prev, [deleteLessonTarget.moduleId]: res.data?.data || [] }));
      setDeleteLessonTarget(null);
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button icon={Plus} size="sm" onClick={() => setModuleModal(true)}>Add Module</Button>
      </div>

      {modules.length === 0 ? (
        <EmptyState icon={FileText} title="No modules yet" description="Break your course into modules, then add lessons to each." />
      ) : (
        modules.map((mod) => (
          <Card key={mod._id || mod.id} style={{ padding: 0, overflow: 'hidden' }}>
            <div
              className="row"
              style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--sp-4) var(--sp-5)', background: 'var(--color-paper-50)', border: 'none', borderBottom: expanded[mod._id || mod.id] ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}
              onClick={() => toggleExpand(mod._id || mod.id)}
            >
              <span className="row" style={{ fontWeight: 600 }}>
                {expanded[mod._id || mod.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {mod.title}
              </span>
              <span className="row">
                <Button size="sm" variant="ghost" icon={Plus} onClick={(e) => { e.stopPropagation(); setLessonForm({ title: '', description: '', type: 'VIDEO', videoUrl: '', content: '', contentUrl: '', durationMinutes: '' }); setLessonModal({ moduleId: mod._id || mod.id }); }}>Add Lesson</Button>
                <Button size="sm" variant="ghost" icon={Trash2} onClick={(e) => { e.stopPropagation(); setDeleteModuleTarget(mod); }} />
              </span>
            </div>
            {expanded[mod._id || mod.id] && (
              <div style={{ padding: 'var(--sp-2) var(--sp-5) var(--sp-4)' }}>
                {(lessonsByModule[mod._id || mod.id] || []).length === 0 && (
                  <p className="text-muted" style={{ fontSize: 'var(--fs-sm)', padding: 'var(--sp-3) 0' }}>No lessons in this module yet.</p>
                )}
                {(lessonsByModule[mod._id || mod.id] || []).map((lesson) => (
                  <div key={lesson._id || lesson.id} className="row" style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="row" style={{ fontSize: 'var(--fs-sm)' }}>
                      {lesson.type === 'VIDEO' ? <Video size={15} /> : lesson.type === 'QUIZ' ? <HelpCircle size={15} /> : <FileText size={15} />}
                      {lesson.title}
                      <span className="text-muted" style={{ fontSize: 'var(--fs-2xs)' }}>{lesson.durationMinutes ? `${lesson.durationMinutes} min` : ''}</span>
                    </span>
                    <span className="row" style={{ gap: '12px', alignItems: 'center' }}>
                      <Link to={`${base}/courses/${courseId}/lessons/${lesson._id || lesson.id}/preview`} state={{ lesson }} style={{ fontSize: 'var(--fs-xs)', textDecoration: 'underline', color: 'var(--color-primary-600)' }}>
                        Preview Lesson
                      </Link>
                      {lesson.type === 'VIDEO' && (
                        <Link to={`${base}/courses/${courseId}/lessons/${lesson._id || lesson.id}/video-quizzes`} state={{ lesson }} style={{ fontSize: 'var(--fs-xs)', textDecoration: 'underline', color: 'var(--color-primary-600)' }}>
                          Manage Quizzes
                        </Link>
                      )}
                      <Button size="sm" variant="ghost" icon={Pencil} onClick={() => {
                        setLessonForm({
                          title: lesson.title || '',
                          description: lesson.description || '',
                          type: lesson.type || 'VIDEO',
                          videoUrl: lesson.videoUrl || '',
                          content: lesson.content || '',
                          contentUrl: lesson.contentUrl || '',
                          durationMinutes: lesson.durationMinutes || ''
                        });
                        setLessonModal({ moduleId: mod._id || mod.id, lessonId: lesson._id || lesson.id });
                      }} />
                      <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteLessonTarget({ ...lesson, moduleId: mod._id || mod.id })} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))
      )}

      <Modal open={moduleModal} onClose={() => setModuleModal(false)} title="Add Module" width={420}>
        <form className="stack" id="module-form" onSubmit={submitModule}>
          <Field label="Module Title" required><Input value={moduleForm.title} onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))} required /></Field>
          <Field label="Description"><Textarea rows={3} value={moduleForm.description} onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        </form>
        <div className="modal-panel__foot" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <Button variant="outline" type="button" onClick={() => setModuleModal(false)}>Cancel</Button>
          <Button type="submit" form="module-form" loading={saving}>Add Module</Button>
        </div>
      </Modal>

      <Modal open={!!lessonModal} onClose={() => setLessonModal(null)} title={lessonModal?.lessonId ? "Edit Lesson" : "Add Lesson"} width={460}>
        <form className="stack" id="lesson-form" onSubmit={submitLesson}>
          <Field label="Lesson Title" required><Input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} required /></Field>
          <Field label="Description"><Textarea rows={3} value={lessonForm.description} onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <div className="row" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Type" style={{ flex: 1 }}>
              <Select value={lessonForm.type} onChange={(e) => setLessonForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Document / PDF</option>
                <option value="TEXT">Text</option>
              </Select>
            </Field>
            <Field label="Duration (Minutes)" style={{ flex: 1 }}>
              <Input type="number" min="0" value={lessonForm.durationMinutes} onChange={(e) => setLessonForm((f) => ({ ...f, durationMinutes: e.target.value }))} placeholder="e.g. 15" />
            </Field>
          </div>
          <Field label="Video URL (YouTube/Vimeo)">
            <Input value={lessonForm.videoUrl} onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://..." />
            {lessonForm.videoUrl && <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)' }}><a href={lessonForm.videoUrl} target="_blank" rel="noreferrer">Test Video Link</a></div>}
          </Field>
          
          <Field label="Supplemental Document (PDF/Doc)">
            <FileUploader 
              accept={{ 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] }} 
              onUploaded={(url) => setLessonForm((f) => ({ ...f, contentUrl: url }))} 
              label="Upload supplemental document" 
            />
            {lessonForm.contentUrl && <div style={{ marginTop: 8, fontSize: 'var(--fs-xs)' }}><a href={buildStaticUrl(lessonForm.contentUrl)} target="_blank" rel="noreferrer">View Uploaded Document</a></div>}
          </Field>
        </form>
        <div className="modal-panel__foot" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <Button variant="outline" type="button" onClick={() => setLessonModal(null)}>Cancel</Button>
          <Button type="submit" form="lesson-form" loading={saving}>{lessonModal?.lessonId ? 'Save Changes' : 'Add Lesson'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteModuleTarget} onClose={() => setDeleteModuleTarget(null)} onConfirm={doDeleteModule} title="Delete this module?" description="All lessons within it will also be removed." confirmLabel="Delete Module" />
      <ConfirmDialog open={!!deleteLessonTarget} onClose={() => setDeleteLessonTarget(null)} onConfirm={doDeleteLesson} title="Delete this lesson?" confirmLabel="Delete Lesson" />
    </div>
  );
}

/* ---------------------------- Students Tab ---------------------------- */

function StudentsTab({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi.getStudents(courseId).then((res) => setStudents(res.data?.data || [])).finally(() => setLoading(false));
  }, [courseId]);

  return (
    <DataTable
      loading={loading}
      emptyLabel="No students enrolled in this course yet."
      columns={[
        { key: 'fullName', header: 'Name', render: (r) => r.studentId?.fullName || r.student?.fullName || r.fullName || '—' },
        { key: 'email', header: 'Email', render: (r) => r.studentId?.email || r.student?.email || r.email || '—' },
        { key: 'progress', header: 'Progress', render: (r) => `${r.progressPercentage ?? 0}%` },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.studentId?.status || r.status || 'ACTIVE'} /> },
        { key: 'enrolledAt', header: 'Enrolled On', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' },
      ]}
      rows={students}
    />
  );
}

/* ---------------------------- Assignments Tab ---------------------------- */

function AssignmentsTab({ courseId, base }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', totalMarks: 100 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    assignmentsApi.list(courseId).then((res) => setAssignments(res.data?.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, [courseId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await assignmentsApi.create(courseId, { ...form, totalMarks: Number(form.totalMarks) });
      toast.success('Assignment created');
      setModalOpen(false);
      setForm({ title: '', description: '', dueDate: '', totalMarks: 100 });
      load();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {base === '/faculty' && <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>New Assignment</Button>}
      </div>
      <DataTable
        loading={loading}
        emptyLabel="No assignments created for this course yet."
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'dueDate', header: 'Due Date', render: (r) => (r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—') },
          { key: 'totalMarks', header: 'Max Score', render: (r) => r.totalMarks },
          { key: 'submissionsCount', header: 'Submissions', render: (r) => r.submissionsCount ?? 0 },
          {
            key: 'actions', header: 'Actions', render: (r) => (
              <Link to={`${base}/courses/${courseId}/assignments/${r._id || r.id}/submissions`}>
                <Button size="sm" variant="outline">View Submissions</Button>
              </Link>
            ),
          },
        ]}
        rows={assignments}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Assignment" width={460}>
        <form className="stack" id="assignment-form" onSubmit={submit}>
          <Field label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></Field>
          <Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <div className="form-grid">
            <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></Field>
            <Field label="Max Score"><Input type="number" value={form.totalMarks} onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))} /></Field>
          </div>
        </form>
        <div className="modal-panel__foot" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="assignment-form" loading={saving}>Create Assignment</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------------------- Exams Tab ---------------------------- */

function ExamsTab({ courseId, base }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addExam, setAddExam] = useState({ title: '', durationMinutes: 60, totalMarks: 100, passingPercentage: 40, maxAttempts: 3, isFinalExam: false });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    examsApi.list(courseId).then((res) => setExams(res.data?.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, [courseId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await examsApi.create(courseId, {
        ...addExam,
        durationMinutes: Number(addExam.durationMinutes),
        totalMarks: Number(addExam.totalMarks),
        passingPercentage: Number(addExam.passingPercentage),
        maxAttempts: Number(addExam.maxAttempts),
        isFinalExam: addExam.isFinalExam,
      });
      toast.success('Exam created');
      setModalOpen(false);
      load();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {base === '/faculty' && <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>New Exam</Button>}
      </div>
      <DataTable
        loading={loading}
        emptyLabel="No exams created for this course yet."
        columns={[
          { key: 'title', header: 'Title' },
          { key: 'durationMinutes', header: 'Duration', render: (r) => `${r.durationMinutes} min` },
          { key: 'totalMarks', header: 'Total Marks' },
          { key: 'type', header: 'Type', render: (r) => r.isFinalExam ? <StatusBadge status="FINAL EXAM" /> : <span className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>Standard</span> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status || (r.isPublished ? 'PUBLISHED' : 'DRAFT')} /> },
          {
            key: 'actions', header: 'Actions', render: (r) => (
              <div className="row" style={{ gap: '8px' }}>
                <Link to={`${base}/courses/${courseId}/exams/${r._id || r.id}`}>
                  <Button size="sm" variant="outline">Manage</Button>
                </Link>
                <Link to={`${base}/courses/${courseId}/exams/${r._id || r.id}/results`}>
                  <Button size="sm" variant="ghost">View Results</Button>
                </Link>
              </div>
            ),
          },
        ]}
        rows={exams}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Exam" width={440}>
        <form className="stack" id="exam-form" onSubmit={submit}>
          <Field label="Title" required><Input value={addExam.title} onChange={(e) => setAddExam((f) => ({ ...f, title: e.target.value }))} required /></Field>
          <div className="form-grid">
            <Field label="Duration (min)"><Input type="number" value={addExam.durationMinutes} onChange={(e) => setAddExam((f) => ({ ...f, durationMinutes: e.target.value }))} /></Field>
            <Field label="Total Marks"><Input type="number" value={addExam.totalMarks} onChange={(e) => setAddExam((f) => ({ ...f, totalMarks: e.target.value }))} /></Field>
          </div>
          <div className="form-grid">
            <Field label="Passing Percentage (%)"><Input type="number" min="1" max="100" value={addExam.passingPercentage} onChange={(e) => setAddExam((f) => ({ ...f, passingPercentage: e.target.value }))} /></Field>
            <Field label="Max Attempts"><Input type="number" min="1" max="3" value={addExam.maxAttempts} onChange={(e) => setAddExam((f) => ({ ...f, maxAttempts: e.target.value }))} /></Field>
          </div>
          <div className="row" style={{ alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--color-primary-50)', borderRadius: '8px', border: '1px solid var(--color-primary-100)' }}>
            <input 
              type="checkbox" 
              id="isFinalExam" 
              checked={addExam.isFinalExam} 
              onChange={(e) => setAddExam((f) => ({ ...f, isFinalExam: e.target.checked }))} 
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="isFinalExam" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary-700)', cursor: 'pointer', flex: 1 }}>
              Mark as Final Exam
              <div style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-light)', marginTop: '2px' }}>
                Students must pass this exam to be eligible for a course certificate.
              </div>
            </label>
          </div>
        </form>
        <div className="modal-panel__foot" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="exam-form" loading={saving}>Create Exam</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------------------- Discussions Tab ---------------------------- */

function DiscussionsTab({ courseId, base }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    discussionApi.listThreads(courseId).then((res) => setThreads(res.data?.data || [])).finally(() => setLoading(false));
  };
  useEffect(load, [courseId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await discussionApi.createThread(courseId, form);
      toast.success('Thread created');
      setModalOpen(false);
      setForm({ title: '', content: '' });
      load();
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button icon={Plus} size="sm" onClick={() => setModalOpen(true)}>New Thread</Button>
      </div>
      <DataTable
        loading={loading}
        emptyLabel="No discussions yet for this course."
        columns={[
          { key: 'title', header: 'Title', render: (r) => <div style={{ fontWeight: 600 }}>{r.title}</div> },
          { key: 'author', header: 'Author', render: (r) => r.author?.fullName || '—' },
          { key: 'repliesCount', header: 'Replies', render: (r) => r.repliesCount ?? 0 },
          { key: 'createdAt', header: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
          { key: 'actions', header: 'Actions', render: (r) => (
            <Button size="sm" variant="ghost" onClick={() => setActiveThreadId(r._id || r.id)}>
              View Thread
            </Button>
          )},
        ]}
        rows={threads}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Discussion Thread" width={500}>
        <form className="stack" id="thread-form" onSubmit={submit}>
          <Field label="Title" required><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></Field>
          <Field label="Content" required><Textarea rows={6} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required /></Field>
        </form>
        <div className="modal-panel__foot" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="thread-form" loading={saving}>Post Thread</Button>
        </div>
      </Modal>

      <ThreadDetailModal 
        open={!!activeThreadId}
        onClose={() => setActiveThreadId(null)}
        courseId={courseId}
        threadId={activeThreadId}
        onResolved={() => load()}
      />
    </div>
  );
}
