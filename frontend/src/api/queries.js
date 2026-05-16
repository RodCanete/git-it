import client from './client';

// Auth
export const register = (data) => client.post('/auth/register/', data).then(r => r.data);
export const login = (data) => client.post('/auth/token/', data).then(r => r.data);

// Curriculum
export const fetchModules = () => client.get('/modules/').then(r => r.data);
export const fetchScenario = (id) => client.get(`/scenarios/${id}/`).then(r => r.data);
export const fetchNextTemplate = (scenarioId) => client.get(`/scenarios/${scenarioId}/next-template/`).then(r => r.data);

// Progress
export const fetchProgress = () => client.get('/progress/').then(r => r.data);
export const createSession = (data) => client.post('/sessions/', data).then(r => r.data);
export const endSession = (id, data) => client.patch(`/sessions/${id}/`, data).then(r => r.data);
export const logCommand = (sessionId, data) => client.post(`/sessions/${sessionId}/commands/`, data).then(r => r.data);

// Admin
export const fetchAdminStats = () => client.get('/admin/stats/').then(r => r.data);
export const fetchStudents = () => client.get('/admin/students/').then(r => r.data);
export const fetchStudent = (id) => client.get(`/admin/students/${id}/`).then(r => r.data);
export const fetchIncorrectCommands = () => client.get('/admin/commands/incorrect/').then(r => r.data);
