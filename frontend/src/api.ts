import axios from 'axios';

const api = axios.create({
  // Port updated to match backend launch settings
  baseURL: 'http://localhost:5023/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
