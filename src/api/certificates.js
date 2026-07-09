import client from './client';

export const listTemplates = () => client.get('/certificates/templates');
export const getTemplate = (id) => client.get(`/certificates/templates/${id}`);
export const createTemplate = (data) => client.post('/certificates/templates', data);
export const updateTemplate = (id, data) => client.post(`/certificates/templates/${id}`, data);

export const generate = (data) => client.post('/certificates/generate', data);
export const requestCertificate = (data) => client.post('/certificates/request', data);
export const approveCertificate = (data) => client.post('/certificates/approve', data);

export const myCertificates = () => client.get('/certificates/my-certificates');
export const getById = (id) => client.get(`/certificates/${id}`);
