import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';
import { generateRandomEmail } from './helpers/emailGenerator.js';
import { getBaseUrl } from './helpers/baseUrl.js';
import { performLogin } from './helpers/loginHelper.js';

// Variável de Ambiente: BASE_URL (passada por linha de comando)
const baseUrl = getBaseUrl();

// Trend: Métrica customizada para monitorar tempo de duração das requests
const requestDuration = new Trend('request_duration_ms', true);

// Configuração de estágios (Stages) - 10 usuários virtuais com 15 segundos de duração
export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Ramp-up: sobe até 10 usuários em 10 segundos
    { duration: '5s', target: 10 },   // Stay: mantém 10 usuários por 5 segundos
  ],
  // Thresholds: O teste passa se o percentil 95 do tempo de resposta for menor que 2 segundos
  thresholds: {
    http_req_duration: ['p(95) < 2000'], // 95º percentil deve ser menor que 2000ms
    http_req_failed: ['rate<0.1'],        // Taxa de falha deve ser menor que 10%
  },
  // Exportar dados em JSON e HTML
  ext: {
    loadimpact: {
      projectID: 3356576,
      name: 'Teste de Performance - Agenda de Contatos'
    }
  },
  // Saída em múltiplos formatos
  out: [
    'json=test/k6/results.json',
    'csv=test/k6/results.csv'
  ]
};

export default function () {
  // Group: Fluxo de Registro
  group('Fluxo de Registro', () => {
    const email = generateRandomEmail();
    const loginUser = `user_${Date.now()}`;
    const payload = JSON.stringify({
      nome: 'Usuário Teste',
      telefone: '51999999999',
      email: email,
      login: loginUser,
      senha: 'senha123'
    });

    const params = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = http.post(`${baseUrl}/usuarios/registro`, payload, params);

    // Trend: Adiciona a duração da request à métrica customizada
    requestDuration.add(response.timings.duration);

    // Check: Validação de status code de sucesso
    check(response, {
      'Registro: Status code é 201': (r) => r.status === 201,
      'Registro: Response contém mensagem': (r) => r.body.includes('Usuário registrado com sucesso'),
    });

    // Reaproveitamento de Resposta: Extração de dados do usuário registrado
    if (response.status === 201) {
      const responseBody = response.json();
      const usuarioRegistrado = responseBody.usuario;

      // Group: Fluxo de Login
      group('Fluxo de Login', () => {
        const loginPayload = JSON.stringify({
          login: loginUser,
          senha: 'senha123'
        });

        const loginParams = {
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const loginResponse = http.post(`${baseUrl}/usuarios/login`, loginPayload, loginParams);

        // Trend: Adiciona a duração da request à métrica customizada
        requestDuration.add(loginResponse.timings.duration);

        // Check: Validação de status code de sucesso
        check(loginResponse, {
          'Login: Status code é 200': (r) => r.status === 200,
          'Login: Response contém token': (r) => r.body.includes('token'),
          'Login: Response contém mensagem de sucesso': (r) => r.body.includes('Login realizado com sucesso'),
        });

        // Uso de Token de Autenticação: Extração e uso do token JWT
        if (loginResponse.status === 200) {
          const loginBody = loginResponse.json();
          const token = loginBody.token;

          // Group: Fluxo de Atividade Autenticada (Listar Contatos)
          group('Fluxo de Atividade Autenticada', () => {
            const authParams = {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            };

            const contactResponse = http.get(`${baseUrl}/contatos`, authParams);

            // Trend: Adiciona a duração da request à métrica customizada
            requestDuration.add(contactResponse.timings.duration);

            // Check: Validação de status code de sucesso
            check(contactResponse, {
              'Listar Contatos: Status code é 200': (r) => r.status === 200,
              'Listar Contatos: Response é um array': (r) => Array.isArray(r.json()),
            });
          });
        }
      });
    }
  });
}
