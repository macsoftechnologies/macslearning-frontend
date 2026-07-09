import client from './client';

export const list = () => client.get('/regions');
export const create = (data) => client.post('/regions', data);
export const getById = (id) => client.get(`/regions/${id}`);
export const update = (id, data) => client.patch(`/regions/${id}`, data);
export const remove = (id) => client.delete(`/regions/${id}`);
