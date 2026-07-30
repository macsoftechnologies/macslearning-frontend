import { useState, useRef } from 'react';
import * as tus from 'tus-js-client';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';
import client from '../../api/client';

export default function VimeoUploader({ onUploaded, label = 'Upload Video', videoName = 'Untitled Video' }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const uploadRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith('video/')) {
        setError('Please select a valid video file.');
        return;
      }
      setFile(selected);
      setError(null);
      setSuccess(false);
      setProgress(0);
    }
  };

  const startUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Get ticket from our backend
      const res = await client.post('/vimeo/upload-ticket', {
        fileSize: file.size,
        videoName: videoName || file.name,
      });

      const { uploadLink, link } = res.data.data || res.data;

      // 2. Start tus upload directly to Vimeo
      const upload = new tus.Upload(file, {
        uploadUrl: uploadLink,
        onError: (err) => {
          setError('Failed to upload video: ' + err.message);
          setUploading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          setProgress(Number(percentage));
        },
        onSuccess: () => {
          setSuccess(true);
          setUploading(false);
          // Return the actual Vimeo link (e.g., https://vimeo.com/123456)
          onUploaded(link);
        },
      });

      uploadRef.current = upload;
      upload.start();
    } catch (err) {
      setError(err.message || 'Failed to initialize upload');
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    if (uploadRef.current && uploading) {
      uploadRef.current.abort();
      setUploading(false);
      setProgress(0);
      setFile(null);
    }
  };

  if (success) {
    return (
      <div className="row" style={{ alignItems: 'center', gap: 8, padding: 12, background: 'var(--color-sage-50)', color: 'var(--color-sage-700)', borderRadius: 8, fontSize: 'var(--fs-sm)' }}>
        <CheckCircle size={16} />
        Video uploaded successfully!
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {!uploading && (
        <div className="row" style={{ alignItems: 'center', gap: 12 }}>
          <input
            type="file"
            accept="video/*"
            id="vimeo-upload-input"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            icon={Upload}
            onClick={() => document.getElementById('vimeo-upload-input').click()}
          >
            {file ? file.name : label}
          </Button>

          {file && (
            <Button type="button" variant="primary" onClick={startUpload}>
              Start Upload
            </Button>
          )}
        </div>
      )}

      {uploading && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            <span>Uploading {file?.name}...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary-500)', transition: 'width 0.2s ease' }} />
          </div>
          <div className="row">
             <Button size="sm" variant="ghost" icon={X} onClick={cancelUpload}>Cancel Upload</Button>
          </div>
        </div>
      )}

      {error && (
        <div className="row" style={{ alignItems: 'center', gap: 8, color: 'var(--color-danger)', fontSize: 'var(--fs-xs)' }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}
