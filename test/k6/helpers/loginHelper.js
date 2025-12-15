import http from 'k6/http';
import { getBaseUrl } from './baseUrl.js';

// Helper para fazer login e retornar o token JWT
export function performLogin(login, senha) {
  const baseUrl = getBaseUrl();
  const payload = JSON.stringify({
    login: login,
    senha: senha
  });

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = http.post(`${baseUrl}/usuarios/login`, payload, params);
  
  if (response.status === 200) {
    return response.json('token');
  }
  
  return null;
}
