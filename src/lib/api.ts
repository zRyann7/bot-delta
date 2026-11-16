// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/`,
});

export const getAvisos = async () => {
  const response = await api.get('avisos/');
  return response.data;
};

export default api;