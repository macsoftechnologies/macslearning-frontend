import { useLocation, Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { buildStaticUrl } from '../../api/client';
import Button from '../../components/ui/Button';
const getVideoEmbedUrl = (url) => {
  if (!url) return null;
  try {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') ? url.split('youtu.be/')[1].split('?')[0] : new URL(url).searchParams.get('v');
      return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}` };
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1].split(/[?#]/)[0];
      return { type: 'iframe', src: `https://player.vimeo.com/video/${videoId}` };
    }
  } catch (err) {
    // ignore parse errors
  }
  return { type: 'video', src: buildStaticUrl(url) };
};

export default function LessonPreview() {
  const { pathname } = useLocation();
  const { id } = useParams();
  const location = useLocation();
  
  // Use state if we navigated from CourseDetail, otherwise would need to fetch (skipped for now)
  const lesson = location.state?.lesson;
  const base = pathname.startsWith('/faculty') ? '/faculty' : '/admin';

  if (!lesson) {
    return (
      <div className="page">
        <p>Lesson details not found. Please navigate from the course page.</p>
        <Link to={`${base}/courses/${id}`}><Button variant="outline">Back to Course</Button></Link>
      </div>
    );
  }

  const embed = lesson.type === 'VIDEO' ? getVideoEmbedUrl(lesson.videoUrl) : null;

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <Link to={`${base}/courses/${id}`} className="row text-muted" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to Course
      </Link>

      <div className="page-head" style={{ marginBottom: 'var(--sp-4)' }}>
        <div>
          <span className="page-eyebrow">Lesson Preview</span>
          <h1 className="page-title">{lesson.title}</h1>
        </div>
      </div>

      {embed && (
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', marginBottom: 'var(--sp-6)', borderRadius: '8px', overflow: 'hidden' }}>
          {embed.type === 'iframe' ? (
            <iframe src={embed.src} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          ) : (
            <video src={embed.src} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>
      )}

      {lesson.description && (
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--sp-2)' }}>Description</h2>
          <p style={{ color: 'var(--color-text-light)' }}>{lesson.description}</p>
        </div>
      )}

      {lesson.type === 'TEXT' && lesson.content && (
        <div style={{ marginBottom: 'var(--sp-6)', padding: 'var(--sp-4)', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <p>{lesson.content}</p>
        </div>
      )}

      <div style={{ marginBottom: 'var(--sp-6)' }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 'var(--sp-2)' }}>Attachments ({lesson.contentUrl ? 1 : 0})</h2>
        {lesson.contentUrl ? (
          <div className="row" style={{ padding: 'var(--sp-3)', background: 'var(--color-paper)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <FileText size={20} className="text-muted" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 'var(--fs-sm)' }}>Supplemental Document</p>
            </div>
            <a href={buildStaticUrl(lesson.contentUrl)} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">Download / View</Button>
            </a>
          </div>
        ) : (
          <div style={{ padding: 'var(--sp-4)', background: 'var(--color-paper-50)', borderRadius: '8px', border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--color-text-light)', fontSize: 'var(--fs-sm)' }}>
            No attachments for this lesson.
          </div>
        )}
      </div>
    </div>
  );
}
