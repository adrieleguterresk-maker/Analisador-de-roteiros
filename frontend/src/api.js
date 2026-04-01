import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:3000/api', // Endereço do backend local (IP direto para evitar erro de DNS)
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
