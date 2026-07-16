import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, FileText, Video, PlayCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import * as contentApi from '../../api/content';
import * as progressApi from '../../api/progress';
import * as coursesApi from '../../api/courses';
import * as certificatesApi from '../../api/certificates';
import * as examsApi from '../../api/exams';
import client, { extractErrorMessages, buildStaticUrl } from '../../api/client';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/ui/PageLoader';
import Tabs from '../../components/ui/Tabs';
import Modal from '../../components/ui/Modal';
import StudentExams from '../../components/student/StudentExams';
import StudentAssignments from '../../components/student/StudentAssignments';
import StudentDiscussions from '../../components/student/StudentDiscussions';
import CourseDiscussionSidebar from '../../components/course/CourseDiscussionSidebar';
import ReactPlayer from 'react-player';
const Player = ReactPlayer.default ? ReactPlayer.default : ReactPlayer;
import './CoursePlayer.css';

const getPlayerUrl = (url) => {
  if (!url) return '';
  let trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith('<iframe')) {
    const match = trimmed.match(/src=["'](.*?)["']/);
    if (match && match[1]) trimmed = match[1];
  }
  
  if (trimmed.includes('youtube.com/embed/')) {
    const videoId = trimmed.split('youtube.com/embed/')[1].split(/[?#]/)[0];
    trimmed = `https://www.youtube.com/watch?v=${videoId}`;
  } else if (trimmed.includes('player.vimeo.com/video/')) {
    const videoId = trimmed.split('player.vimeo.com/video/')[1].split(/[?#]/)[0];
    trimmed = `https://vimeo.com/${videoId}`;
  } else if (trimmed.includes('youtube.com/watch')) {
    try {
      const videoId = new URL(trimmed.startsWith('http') ? trimmed : 'https://' + trimmed).searchParams.get('v');
      if (videoId) trimmed = `https://www.youtube.com/watch?v=${videoId}`;
    } catch (e) {}
  } else if (trimmed.includes('youtu.be/')) {
    const videoId = trimmed.split('youtu.be/')[1].split(/[?#]/)[0];
    trimmed = `https://www.youtube.com/watch?v=${videoId}`;
  }

  if (trimmed.startsWith('www.')) trimmed = 'https://' + trimmed;
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.includes('vimeo.com')) {
    if (!trimmed.startsWith('http')) trimmed = 'https://' + trimmed;
  }
  if (trimmed.startsWith('http')) return trimmed;
  return buildStaticUrl(trimmed);
};

export default function CoursePlayer() {
  const { id: courseId } = useParams();
  const [modules, setModules] = useState([]);
  const [lessonsByModule, setLessonsByModule] = useState({});
  const [activeLesson, setActiveLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState('lessons');
  const [videoQuizzes, setVideoQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [answeredQuizzes, setAnsweredQuizzes] = useState(new Set());
  const [theoryAnswer, setTheoryAnswer] = useState('');
  const [myAnswers, setMyAnswers] = useState([]);
  const [discussionSidebarOpen, setDiscussionSidebarOpen] = useState(false);
  
  const [course, setCourse] = useState(null);
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [requestingCert, setRequestingCert] = useState(false);
  const [previewContentUrl, setPreviewContentUrl] = useState(null);
  const [finalExam, setFinalExam] = useState(null);
  
  const [selectedOption, setSelectedOption] = useState(null);
  
  const lastSavedTimeRef = useRef(0);
  const lastPlayedSecondsRef = useRef(0);
  const isSeekingRef = useRef(false);
  const playerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [modsRes, progRes, courseRes, examsRes] = await Promise.allSettled([
        contentApi.listModules(courseId),
        progressApi.getCourseProgress(courseId),
        coursesApi.getById(courseId),
        examsApi.list(courseId)
      ]);
      const mods = modsRes.status === 'fulfilled' ? modsRes.value.data?.data || [] : [];
      setModules(mods);
      if (progRes.status === 'fulfilled') setProgress(progRes.value.data?.data || null);
      if (courseRes.status === 'fulfilled') setCourse(courseRes.value.data?.data || null);
      if (examsRes.status === 'fulfilled') {
        const allExams = examsRes.value.data?.data || [];
        const fExam = allExams.find(e => e.isFinalExam && e.status === 'PUBLISHED');
        setFinalExam(fExam);
      }

      // Check if student already has a certificate
      try {
        const certsRes = await certificatesApi.myCertificates();
        const myCerts = certsRes.data?.data || [];
        const thisCourseCert = myCerts.find(c => (c.courseId?._id || c.courseId) === courseId);
        if (thisCourseCert) {
          setCertificateStatus(thisCourseCert);
        }
      } catch (err) {}

      const lessonMap = {};
      for (const mod of mods) {
        const mId = mod._id || mod.id;
        const res = await contentApi.listLessons(courseId, mId).catch(() => null);
        lessonMap[mId] = res?.data?.data || [];
      }
      setLessonsByModule(lessonMap);
      const firstModule = mods[0];
      if (firstModule) {
        const fmId = firstModule._id || firstModule.id;
        if (lessonMap[fmId]?.length) {
          const l = lessonMap[fmId][0];
          setActiveLesson({ ...l, moduleId: fmId });
          loadQuizzes(fmId, l._id || l.id);
        }
      }
      setLoading(false);
    })();
  }, [courseId]);

  const loadQuizzes = async (mId, lId) => {
    try {
      const [res, ansRes] = await Promise.all([
        client.get(`/courses/${courseId}/content/modules/${mId}/lessons/${lId}/video-quizzes`),
        contentApi.getMyVideoQuizAnswers(courseId, mId, lId)
      ]);
      setVideoQuizzes(res.data?.data || []);
      
      const answersList = ansRes.data?.data || [];
      setMyAnswers(answersList);
      
      const answeredSet = new Set(answersList.map(a => a.quizId?._id || a.quizId?.id));
      setAnsweredQuizzes(answeredSet);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLessonChange = (lesson, modId) => {
    setActiveLesson({ ...lesson, moduleId: modId });
    setActiveTab('lessons');
    loadQuizzes(modId, lesson._id || lesson.id);
  };

  const handleProgress = (state) => {
    const currentSeconds = Math.floor(state.playedSeconds);
    const lastSeconds = lastPlayedSecondsRef.current;

    // Check if they skipped ahead by more than 2 seconds
    if (currentSeconds > lastSeconds + 2) {
      const skippedQuiz = videoQuizzes
        .sort((a, b) => a.timestampSeconds - b.timestampSeconds)
        .find(q => {
          const ts = Math.floor(q.timestampSeconds);
          return ts > lastSeconds && ts <= currentSeconds && !answeredQuizzes.has(q._id || q.id);
        });

      if (skippedQuiz) {
        playerRef.current?.seekTo(skippedQuiz.timestampSeconds, 'seconds');
        setPlaying(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setActiveQuiz(skippedQuiz);
        setSelectedOption(null);
        setTheoryAnswer('');
        return;
      }
    }

    lastPlayedSecondsRef.current = currentSeconds;

    const quiz = videoQuizzes.find(q => Math.floor(q.timestampSeconds) === currentSeconds);
    
    if (quiz && !answeredQuizzes.has(quiz._id || quiz.id)) {
      setPlaying(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setActiveQuiz(quiz);
      setSelectedOption(null);
      setTheoryAnswer('');
    }

    if (state.played >= 0.9 && activeLesson && !isCompleted(activeLesson._id || activeLesson.id) && !completing) {
      markComplete(activeLesson._id || activeLesson.id);
    }
    
    // Save granular progress every 10 seconds of playback
    if (activeLesson && Math.abs(currentSeconds - lastSavedTimeRef.current) >= 10 && !isSeekingRef.current) {
      lastSavedTimeRef.current = currentSeconds;
      progressApi.updateWatchTime(activeLesson._id || activeLesson.id, courseId, activeLesson.moduleId, currentSeconds).catch(() => {});
    }
  };

  const handleReady = () => {
    // Attempt to resume playback
    if (progress && activeLesson) {
      const activeLessonId = activeLesson._id || activeLesson.id;
      const lessonProg = progress.completedLessons?.find(l => (l.lessonId?._id || l.lessonId || l.id) === activeLessonId);
      if (lessonProg && lessonProg.watchedSeconds && lessonProg.watchedSeconds > 0) {
        playerRef.current?.seekTo(lessonProg.watchedSeconds, 'seconds');
        lastSavedTimeRef.current = lessonProg.watchedSeconds;
        isSeekingRef.current = true;
        setTimeout(() => isSeekingRef.current = false, 1000); // Prevent instant re-save
      }
    }
  };

  const handleQuizAnswer = async (optionOrText, isTheory = false) => {
    try {
      const payload = isTheory ? { textAnswer: optionOrText } : { selectedOption: optionOrText.text };
      
      await client.post(
        `/courses/${courseId}/content/modules/${activeLesson.moduleId}/lessons/${activeLesson._id || activeLesson.id}/video-quizzes/${activeQuiz._id || activeQuiz.id}/answers`,
        payload
      );

      if (!isTheory) {
        if (optionOrText.isCorrect) toast.success('Correct!');
        else toast.error('Incorrect! You can review this again later.');
      } else {
        toast.success('Answer submitted for review!');
      }

      setAnsweredQuizzes(new Set([...answeredQuizzes, activeQuiz._id || activeQuiz.id]));
      setActiveQuiz(null);
      setPlaying(true);
      loadQuizzes(activeLesson.moduleId, activeLesson._id || activeLesson.id);
    } catch (err) {
      extractErrorMessages(err).forEach(m => toast.error(m));
    }
  };

  const isCompleted = (lessonId) => progress?.completedLessonIds?.includes(lessonId) || progress?.completedLessons?.some?.((l) => l.id === lessonId);

  const markComplete = async (lessonIdToComplete) => {
    const idToUse = lessonIdToComplete || (activeLesson?._id || activeLesson?.id);
    if (!idToUse) return;
    setCompleting(true);
    try {
      await progressApi.completeLesson(idToUse, courseId, activeLesson?.moduleId);
      toast.success('Lesson auto-tracked as complete!');
      const res = await progressApi.getCourseProgress(courseId);
      setProgress(res.data?.data || null);
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setCompleting(false);
    }
  };

  const requestCertificate = async () => {
    setRequestingCert(true);
    try {
      const res = await certificatesApi.requestCertificate({ courseId });
      toast.success('Certificate requested successfully!');
      setCertificateStatus(res.data?.data || {});
    } catch (err) {
      extractErrorMessages(err).forEach((m) => toast.error(m));
    } finally {
      setRequestingCert(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className={`player-container ${discussionSidebarOpen ? 'sidebar-open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="row" style={{ padding: '0 var(--sp-6)', borderBottom: '1px solid var(--border-subtle)', background: '#fff', justifyContent: 'space-between' }}>
        <Tabs 
          tabs={[
            { key: 'lessons', label: 'Lessons' },
            { key: 'assignments', label: 'Assignments' },
            { key: 'exams', label: 'Exams' },
            { key: 'discussions', label: 'Discussions' }
          ]} 
          active={activeTab} 
          onChange={setActiveTab} 
        />
        <Button variant="outline" size="sm" icon={MessageSquare} onClick={() => setDiscussionSidebarOpen(true)}>
          Course Chat
        </Button>
      </div>
      
      <div className="player" style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'lessons' ? (
          <>
            <aside className="player__sidebar">
        <Link to="/student/my-courses" className="row text-muted" style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, marginBottom: 'var(--sp-4)' }}>
          <ArrowLeft size={14} /> Back to my courses
        </Link>
        <div className="player__progress">
          <div className="course-card__progress-bar"><span style={{ width: `${progress?.progressPercentage || 0}%` }} /></div>
          <span className="text-muted" style={{ fontSize: 'var(--fs-2xs)' }}>{progress?.progressPercentage || 0}% completed</span>
        </div>

        {progress?.progressPercentage === 100 && course?.certificateTemplateId && (
          <div style={{ margin: '0 0 var(--sp-4) 0', padding: '12px', background: 'var(--color-primary-50)', borderRadius: '8px', border: '1px solid var(--color-primary-200)', textAlign: 'center' }}>
            {certificateStatus ? (
              <a href={certificateStatus.certificateUrl} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                <Button variant="primary" style={{ width: '100%', fontSize: '13px' }}>View Certificate</Button>
              </a>
            ) : finalExam ? (
              <Link to={`/student/my-courses/${courseId}/exams/${finalExam._id || finalExam.id}/take`} style={{ display: 'block' }}>
                <Button variant="primary" style={{ width: '100%', fontSize: '13px' }}>Attend Final Exam</Button>
              </Link>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                Your certificate is pending final exam setup.
              </div>
            )}
          </div>
        )}

        {modules.map((mod) => (
          <div key={mod._id || mod.id} className="player__module">
            <p className="player__module-title">{mod.title}</p>
            {(lessonsByModule[mod._id || mod.id] || []).map((lesson) => (
              <button
                key={lesson._id || lesson.id}
                className={`player__lesson ${activeLesson?._id === lesson._id || activeLesson?.id === lesson.id ? 'player__lesson--active' : ''}`}
                onClick={() => handleLessonChange(lesson, mod._id || mod.id)}
              >
                {isCompleted(lesson._id || lesson.id) ? (
                  <CheckCircle2 size={15} color="var(--success)" />
                ) : (
                  progress?.completedLessons?.find(l => (l.lessonId?._id || l.lessonId || l.id) === (lesson._id || lesson.id))?.watchedSeconds > 0 ? (
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-primary-600)', background: 'var(--color-primary-100)', padding: '2px 4px', borderRadius: '4px' }}>In Progress</span>
                  ) : <Circle size={15} />
                )}
                {lesson.type === 'VIDEO' ? <Video size={13} /> : <FileText size={13} />}
                <span>{lesson.title}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className="player__content">
        {!activeLesson ? (
          <div style={{ padding: 'var(--sp-10)', textAlign: 'center' }} className="text-muted">
            This course doesn't have any content yet.
          </div>
        ) : (
          <div className="player__lesson-view">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)', marginBottom: 'var(--sp-4)' }}>{activeLesson.title}</h1>

            {activeLesson.type === 'VIDEO' && activeLesson.videoUrl && (
              <div className="player__video-wrapper" style={{ width: '100%', aspectRatio: '16/9', background: '#000', marginBottom: 'var(--sp-6)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                <Player
                  ref={playerRef}
                  url={getPlayerUrl(activeLesson.videoUrl)}
                  controls={!activeQuiz}
                  playing={playing}
                  onProgress={handleProgress}
                  onReady={handleReady}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  width="100%"
                  height="100%"
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: activeQuiz ? 'none' : 'auto' }}
                />
                
                {activeQuiz && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 'var(--sp-6)' }}>
                    <div style={{ background: '#ffffff', color: '#0f172a', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: 500, maxHeight: '90%', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {activeQuiz.type === 'THEORY' ? 'Short Answer' : activeQuiz.type === 'TRUE_FALSE' ? 'True or False' : 'Quick Knowledge Check'}
                        </span>
                      </div>
                      <p style={{ marginBottom: '28px', fontSize: '18px', fontWeight: 600, lineHeight: 1.5 }}>{activeQuiz.questionText}</p>
                      <div className="stack" style={{ gap: '12px' }}>
                        {activeQuiz.type === 'THEORY' ? (
                          <>
                            <textarea 
                              value={theoryAnswer}
                              onChange={e => setTheoryAnswer(e.target.value)}
                              placeholder="Type your answer here..."
                              style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '120px', fontFamily: 'inherit', fontSize: '15px' }}
                            />
                            <Button onClick={() => handleQuizAnswer(theoryAnswer, true)} disabled={!theoryAnswer.trim()}>
                              Submit Answer
                            </Button>
                          </>
                        ) : (
                          <>
                            {activeQuiz.options?.map((opt, i) => (
                              <Button 
                                key={i} 
                                variant={selectedOption?.text === opt.text ? "primary" : "outline"} 
                                onClick={() => setSelectedOption(opt)} 
                                style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '14px 20px', fontSize: '15px', borderColor: selectedOption?.text === opt.text ? 'transparent' : '#cbd5e1', color: selectedOption?.text === opt.text ? '#fff' : '#334155', background: selectedOption?.text === opt.text ? 'var(--color-primary-600)' : '#f8fafc' }}
                              >
                                {opt.text}
                              </Button>
                            ))}
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                              <Button onClick={() => handleQuizAnswer(selectedOption)} disabled={!selectedOption}>
                                Submit Answer
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLesson.description && (
              <div style={{ marginBottom: 'var(--sp-6)' }}>
                <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--sp-2)' }}>Description</h2>
                <p style={{ color: 'var(--color-text-light)' }}>{activeLesson.description}</p>
              </div>
            )}

            {myAnswers.length > 0 && (
              <div style={{ marginBottom: 'var(--sp-6)', padding: 'var(--sp-5)', background: 'var(--color-paper-50)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--sp-4)' }}>Your Quiz Results</h2>
                <div className="stack" style={{ gap: 'var(--sp-4)' }}>
                  {myAnswers.map((ans, i) => (
                    <div key={ans._id || ans.id} style={{ background: '#fff', padding: 'var(--sp-4)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Question {i + 1}</span>
                        {ans.isGraded ? (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: ans.isCorrect ? '#dcfce7' : '#f1f5f9', color: ans.isCorrect ? '#166534' : '#475569' }}>
                            {ans.marks} / {ans.quizId?.maxMarks} Marks
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: '#fef08a', color: '#854d0e' }}>
                            Pending Review
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '15px', marginBottom: '12px', color: '#334155' }}>{ans.quizId?.questionText}</p>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '14px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 600, color: '#64748b', marginRight: '8px' }}>Your Answer:</span>
                        {ans.selectedOption || ans.textAnswer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeLesson.type === 'DOCUMENT' && activeLesson.documentUrl && (
              <div style={{ marginBottom: 'var(--sp-6)', borderRadius: '8px', overflow: 'hidden', height: '75vh', border: '1px solid var(--border-subtle)' }}>
                <iframe 
                  title="lesson-doc" 
                  src={
                    activeLesson.documentUrl.toLowerCase().endsWith('.pdf') || activeLesson.documentUrl.match(/\.(jpe?g|png|gif|svg)$/i)
                      ? buildStaticUrl(activeLesson.documentUrl)
                      : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(buildStaticUrl(activeLesson.documentUrl))}`
                  } 
                  className="player__pdf" 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            )}

            {activeLesson.type === 'TEXT' && (
              <div className="player__text" style={{ marginBottom: 'var(--sp-6)' }}>{activeLesson.content || 'No content provided.'}</div>
            )}

            <div style={{ marginBottom: 'var(--sp-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--sp-2)' }}>Attachments ({activeLesson.contentUrl ? 1 : 0})</h2>
              {activeLesson.contentUrl ? (
                <div className="row" style={{ padding: 'var(--sp-3)', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <FileText size={20} className="text-muted" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: 'var(--fs-sm)' }}>Supplemental Document</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="outline" size="sm" onClick={() => setPreviewContentUrl(activeLesson.contentUrl)}>View</Button>
                    <a href={buildStaticUrl(activeLesson.contentUrl)} download rel="noreferrer">
                      <Button variant="ghost" size="sm">Download</Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 'var(--sp-4)', background: 'var(--color-paper-50)', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--color-text-light)', fontSize: 'var(--fs-sm)' }}>
                  No attachments for this lesson.
                </div>
              )}
            </div>

            {!activeLesson.videoUrl && !activeLesson.documentUrl && activeLesson.type !== 'TEXT' && (
              <div className="player__placeholder">
                <PlayCircle size={36} />
                <p>Content for this lesson will be available soon.</p>
              </div>
            )}

            <div className="row" style={{ justifyContent: 'space-between', marginTop: 'var(--sp-6)', paddingBottom: 'var(--sp-6)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="row text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                <MessageSquare size={14} /> Have a question? Ask in the course discussion board.
              </span>
              <Button
                icon={CheckCircle2}
                onClick={markComplete}
                loading={completing}
                disabled={isCompleted(activeLesson.id)}
                variant={isCompleted(activeLesson.id) ? 'outline' : 'primary'}
              >
                {isCompleted(activeLesson.id) ? 'Completed' : 'Mark as Complete'}
              </Button>
            </div>

            {/* Lesson Specific Q&A */}
            <div style={{ marginTop: 'var(--sp-8)' }}>
              <StudentDiscussions courseId={courseId} lessonId={activeLesson._id || activeLesson.id} />
            </div>
          </div>
        )}
      </main>
        </>
        ) : (
          <main className="player__content" style={{ overflowY: 'auto', background: 'var(--color-paper-50)' }}>
            {activeTab === 'assignments' && <StudentAssignments courseId={courseId} />}
            {activeTab === 'exams' && <StudentExams courseId={courseId} />}
            {activeTab === 'discussions' && <StudentDiscussions courseId={courseId} />}
          </main>
        )}
      </div>
      
      <CourseDiscussionSidebar 
        open={discussionSidebarOpen} 
        onClose={() => setDiscussionSidebarOpen(false)} 
        courseId={courseId} 
      />

      <Modal open={!!previewContentUrl} onClose={() => setPreviewContentUrl(null)} title="View Attachment" width={800}>
        <div style={{ height: '70vh', width: '100%' }}>
          {previewContentUrl && (
            <iframe
              src={isDocument(previewContentUrl) ? (
                previewContentUrl.toLowerCase().endsWith('.pdf') ? buildStaticUrl(previewContentUrl) :
                (buildStaticUrl(previewContentUrl).includes('localhost') ? buildStaticUrl(previewContentUrl) : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(buildStaticUrl(previewContentUrl))}`)
              ) : buildStaticUrl(previewContentUrl)}
              title="Attachment Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
