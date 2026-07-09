import client from './client';

export const list = (params) => client.get('/categories', { params });
export const getById = (id) => client.get(`/categories/${id}`);
export const create = (data) => client.post('/categories', data);
export const update = (id, data) => client.patch(`/categories/${id}`, data);
export const remove = (id) => client.delete(`/categories/${id}`);
