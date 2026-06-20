import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://memoryforge-ai-engineer.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('API Error (health):', error);
    throw error;
  }
};

export const sendChatMessage = async (message) => {
  try {
    const response = await api.post('/chat', { message });
    return response.data;
  } catch (error) {
    console.error('API Error (chat):', error);
    throw error;
  }
};

export const getMemories = async () => {
  try {
    const response = await api.get('/memories');
    return response.data;
  } catch (error) {
    console.error('API Error (memories):', error);
    throw error;
  }
};

export const createMemory = async (type, content) => {
  try {
    const response = await api.post('/memories', { type, content });
    return response.data;
  } catch (error) {
    console.error('API Error (createMemory):', error);
    throw error;
  }
};

export default api;
