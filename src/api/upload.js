import client from './client';

export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total));
    },
  });
};
