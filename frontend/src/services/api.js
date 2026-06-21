import axios from 'axios';

// Fallback to local server during local development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT authorization token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Backend Health ---
export const getHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('API Error (health):', error);
    throw error;
  }
};

// --- Authentication & User Operations ---
export const registerUser = async (name, email, password, role = 'USER') => {
  try {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data;
  } catch (error) {
    console.error('API Error (register):', error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('API Error (login):', error.response?.data || error.message);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('API Error (getProfile):', error.response?.data || error.message);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('API Error (getUsers):', error.response?.data || error.message);
    throw error;
  }
};

// --- AI Engineering Agent Chat ---
export const sendChatMessage = async (message) => {
  try {
    const response = await api.post('/chat', { message });
    return response.data;
  } catch (error) {
    console.error('API Error (chat):', error.response?.data || error.message);
    throw error;
  }
};

export const getChatHistory = async () => {
  try {
    const response = await api.get('/chat/history');
    return response.data;
  } catch (error) {
    console.error('API Error (chatHistory):', error.response?.data || error.message);
    throw error;
  }
};

// --- Workspace Memories API ---
export const getMemories = async () => {
  try {
    const response = await api.get('/memories');
    return response.data;
  } catch (error) {
    console.error('API Error (memories):', error.response?.data || error.message);
    throw error;
  }
};

export const createMemory = async (type, content) => {
  try {
    const response = await api.post('/memories', { type, content });
    return response.data;
  } catch (error) {
    console.error('API Error (createMemory):', error.response?.data || error.message);
    throw error;
  }
};

// --- Knowledge Management API ---
export const getKnowledge = async () => {
  try {
    const response = await api.get('/knowledge');
    return response.data;
  } catch (error) {
    console.error('API Error (getKnowledge):', error.response?.data || error.message);
    throw error;
  }
};

export const createKnowledgeItem = async (title, content) => {
  try {
    const response = await api.post('/knowledge', { title, content });
    return response.data;
  } catch (error) {
    console.error('API Error (createKnowledgeItem):', error.response?.data || error.message);
    throw error;
  }
};

// --- Document Upload System ---
export const uploadDocumentFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Error (uploadDocumentFile):', error.response?.data || error.message);
    throw error;
  }
};

// --- Analytics Metrics ---
export const getAnalyticsData = async () => {
  try {
    const response = await api.get('/analytics');
    return response.data;
  } catch (error) {
    console.error('API Error (getAnalyticsData):', error.response?.data || error.message);
    throw error;
  }
};

// --- Phase 7: File Intelligence & Project Knowledge Ingestion ---
export const uploadFileDoc = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Error (uploadFileDoc):', error.response?.data || error.message);
    throw error;
  }
};

export const uploadFileImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Error (uploadFileImage):', error.response?.data || error.message);
    throw error;
  }
};

export const uploadFileProject = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/project', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('API Error (uploadFileProject):', error.response?.data || error.message);
    throw error;
  }
};

export const searchKnowledge = async (query) => {
  try {
    const response = await api.get('/knowledge/search', {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error('API Error (searchKnowledge):', error.response?.data || error.message);
    throw error;
  }
};

export const getKnowledgeHistory = async () => {
  try {
    const response = await api.get('/knowledge/history');
    return response.data;
  } catch (error) {
    console.error('API Error (getKnowledgeHistory):', error.response?.data || error.message);
    throw error;
  }
};

export const getKnowledgeImages = async () => {
  try {
    const response = await api.get('/knowledge/images');
    return response.data;
  } catch (error) {
    console.error('API Error (getKnowledgeImages):', error.response?.data || error.message);
    throw error;
  }
};

export const getKnowledgeImage = async (id) => {
  try {
    const response = await api.get(`/knowledge/image/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error (getKnowledgeImage):', error.response?.data || error.message);
    throw error;
  }
};

export default api;

