import client from './client';

export const getPublicBySlug = (slug) => client.get(`/public/organizations/${slug}`);

export const list = (params) => client.get('/organizations', { params });
export const create = (data) => client.post('/organizations', data);
export const updateStatus = (id, status) => client.patch(`/organizations/${id}/status`, { status });
export const getMe = () => client.get('/organizations/me');
export const updateMe = (data) => client.patch('/organizations/me', data);

export const getCoursePlans = () => client.get('/organizations/me/course-plans');
export const createCoursePlan = (data) => client.post('/organizations/me/course-plans', data);
export const updateCoursePlan = (planId, data) => client.patch(`/organizations/me/course-plans/${planId}`, data);
export const deleteCoursePlan = (planId) => client.delete(`/organizations/me/course-plans/${planId}`);
