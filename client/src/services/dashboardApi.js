import { requestJson } from './apiClient.js';

export const getDashboardStats = async () => {
  const response = await requestJson('/api/dashboard/stats', {
    auth: true,
  });

  return response?.data || null;
};

export const getStudentDetails = async (studentId) => {
  const response = await requestJson(`/api/dashboard/student/${studentId}`, {
    auth: true,
  });

  return response?.data || null;
};
