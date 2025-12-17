import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { generateRandomEmail } from './helpers/emailGenerator.js';
import { getBaseUrl } from './helpers/baseUrl.js';

const baseUrl = getBaseUrl();
const requestDuration = new Trend('request_duration_ms', true);

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 5 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(90) < 3000'],
    http_req_failed: ['rate<0.1'],
  }
};

export default function () {

  const email = generateRandomEmail();
  const loginUser = `user_${exec.vu.idInTest}_${exec.scenario.iterationInTest}_${Date.now()}`;
  let token = null;

  group('Fluxo de Registro', () => {
    const payload = JSON.stringify({
      nome: 'Usuário Teste',
      telefone: '51999999999',
      email: email,
      login: loginUser,
      senha: 'senha123'
    });

    const params = {
      headers: { 'Content-Type': 'application/json' }
    };

    const response = http.post(`${baseUrl}/usuarios/registro`, payload, params);
    requestDuration.add(response.timings.duration);

    if (response.status !== 201) {
      console.warn(`Erro no Registro [Status ${response.status}]: ${response.body}`);
    }

    check(response, {
      'Registro: Status code é 201': (r) => r.status === 201,
      'Registro: Response contém mensagem': (r) => r.body.includes('Usuário registrado com sucesso'),
    });
  });

  group('Fluxo de Login', () => {
    const loginPayload = JSON.stringify({
      login: loginUser,
      senha: 'senha123'
    });

    const loginParams = {
      headers: { 'Content-Type': 'application/json' }
    };

    const loginResponse = http.post(`${baseUrl}/usuarios/login`, loginPayload, loginParams);
    requestDuration.add(loginResponse.timings.duration);

    check(loginResponse, {
      'Login: Status code é 200': (r) => r.status === 200,
      'Login: Response contém token': (r) => r.body.includes('token'),
      'Login: Response contém mensagem de sucesso': (r) => r.body.includes('Login realizado com sucesso'),
    });

    if (loginResponse.status === 200) {
      const loginBody = loginResponse.json();
      token = loginBody.token;
    }
  });

  if (token) {
    group('Fluxo de Atividade Autenticada', () => {
      const authParams = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const contactResponse = http.get(`${baseUrl}/contatos`, authParams);
      requestDuration.add(contactResponse.timings.duration);

      check(contactResponse, {
        'Listar Contatos: Status code é 200': (r) => r.status === 200,
        'Listar Contatos: Response é um array': (r) => Array.isArray(r.json()),
      });
    });
  }

  sleep(1);
}