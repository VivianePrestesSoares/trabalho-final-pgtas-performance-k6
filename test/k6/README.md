# Testes de Performance com K6

Este diretório contém testes de performance desenvolvidos com **K6**, uma ferramenta moderna para teste de carga e performance de APIs.

## 📋 Visão Geral

Os testes de performance validam o comportamento da API sob diferentes cenários de carga, analisando:
- Tempo de resposta (média, mínimo, máximo, percentil 95)
- Taxa de sucesso das requisições
- Conformidade com limites de desempenho (thresholds)
- Validação de comportamento através de checks

## 🚀 Como Executar

### Pré-requisitos
- K6 instalado na máquina ([Instalação](https://k6.io/docs/getting-started/installation/))
- API rodando em http://localhost:3000 (ou URL configurada via variável de ambiente)

### Execução Básica

```bash
# Com URL local padrão (http://localhost:3000)
k6 run test/k6/performance.js

# Com URL customizada via variável de ambiente
k6 run --env BASE_URL=http://seu-servidor:3000 test/k6/performance.js

# Com saída em JSON e CSV (para geração de relatório)
npm run k6:run

# Executar teste e gerar relatório HTML automaticamente
npm run k6:test
```

## 📊 Relatório de Teste (HTML)

### Geração Automática
```bash
npm run k6:test
```

Este comando executa o teste e gera automaticamente um relatório HTML visual.

### Geração Manual
1. Execute o teste com saída JSON:
   ```bash
   npm run k6:run
   ```

2. Gere o relatório HTML:
   ```bash
   npm run k6:report
   ```

### Arquivos Gerados
- `test/k6/results.json` — Dados brutos do teste em JSON
- `test/k6/results.csv` — Dados brutos do teste em CSV
- `test/k6/report.html` — Relatório visual interativo

### Visualização do Relatório
Abra o arquivo `test/k6/report.html` em um navegador para visualizar:
- ✅ Métricas de desempenho (tempo médio, mínimo, máximo, p95)
- ✅ Status do threshold (se atendeu o requisito p95 < 2 segundos)
- ✅ Total de requisições e taxa de sucesso
- ✅ Resultados detalhados de cada check realizado
- ✅ Visualização clara e responsiva

### Geração do Relatório HTML

Este relatório não é nativo do K6. Ele é gerado pela biblioteca externa **k6-reporter**, que transforma os dados coletados pelo K6 em um arquivo HTML visual e em JSON detalhado, facilitando a análise de métricas de desempenho, latência e sucesso das requisições.

O script `test/k6/generateReport.js` realiza:
1. Leitura dos dados JSON coletados pelo K6
2. Processamento e cálculo de métricas (percentis, média, etc.)
3. Geração de HTML responsivo com design moderno
4. Validação de thresholds e exibição clara do status

## 📁 Estrutura de Arquivos

```
test/k6/
├── performance.js          # Script principal de testes
├── generateReport.js       # Gerador de relatório HTML
├── helpers/
│   ├── emailGenerator.js   # Geração de emails aleatórios
│   ├── baseUrl.js         # Obtenção de URL base
│   └── loginHelper.js     # Helper para login e token JWT
├── results.json           # Dados brutos (gerado após execução)
├── results.csv            # Dados em CSV (gerado após execução)
└── report.html            # Relatório visual (gerado após execução)
```

## 🎯 Conceitos K6 Implementados

### 1. **Stages** (Estágios de Carga)

**Stages** (estágios) definem como a carga aumenta ao longo do tempo. Você especifica durações e quantidades de usuários virtuais para diferentes fases do teste, simulando um aumento gradual de carga.

**Arquivo**: `performance.js` (linhas 15-20)

**Código implementado**:
```javascript
export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Ramp-up: sobe até 10 usuários em 10 segundos
    { duration: '5s', target: 10 },   // Stay: mantém 10 usuários por 5 segundos
  ],
  // ... resto da configuração
};
```

**Explicação**: 
- Primeiro stage: aumenta gradualmente de 0 até 10 usuários virtuais em 10 segundos
- Segundo stage: mantém 10 usuários constantes por 5 segundos
- Simula um padrão real de aumento de tráfego

---

### 2. **Thresholds** (Limites de Sucesso)

**Thresholds** definem critérios de sucesso/falha para o teste. Se as métricas não atenderem aos thresholds, o teste é considerado falho. Útil para CI/CD.

**Arquivo**: `performance.js` (linhas 21-24)

**Código implementado**:
```javascript
thresholds: {
  http_req_duration: ['p(95) < 2000'], // 95º percentil deve ser menor que 2000ms
  http_req_failed: ['rate<0.1'],        // Taxa de falha deve ser menor que 10%
},
```

**Explicação**: 
- `p(95) < 2000`: O percentil 95 do tempo de resposta (95% das requisições) deve ser menor que 2 segundos
- `rate<0.1`: A taxa de falha de requisições deve ser menor que 10%
- Se esses critérios não forem atendidos, o teste falha automaticamente

---

### 3. **Checks** (Validações)

**Checks** são validações específicas que você realiza em cada resposta. Diferente de thresholds que avaliam métricas agregadas, checks validam respostas individuais.

**Arquivo**: `performance.js` (múltiplas ocorrências)

**Código implementado - Validação de Registro**:
```javascript
const response = http.post(`${baseUrl}/usuarios/registro`, payload, params);

check(response, {
  'Registro: Status code é 201': (r) => r.status === 201,
  'Registro: Response contém mensagem': (r) => r.body.includes('Usuário registrado com sucesso'),
});
```

**Código implementado - Validação de Login**:
```javascript
const loginResponse = http.post(`${baseUrl}/usuarios/login`, loginPayload, loginParams);

check(loginResponse, {
  'Login: Status code é 200': (r) => r.status === 200,
  'Login: Response contém token': (r) => r.body.includes('token'),
  'Login: Response contém mensagem de sucesso': (r) => r.body.includes('Login realizado com sucesso'),
});
```

**Explicação**: 
- Cada `check` valida um aspecto específico da resposta
- Se um check falhar, o teste continua mas a falha é registrada
- Útil para identificar problemas específicos em cada endpoint

---

### 4. **Trends** (Métricas Customizadas)

**Trends** são métricas personalizadas que coletam dados contínuos sobre desempenho. Diferente de métricas padrão, você define exatamente o que quer medir.

**Arquivo**: `performance.js` (linhas 11-12)

**Código implementado - Definição**:
```javascript
import { Trend } from 'k6/metrics';

// Trend: Métrica customizada para monitorar tempo de duração das requests
const requestDuration = new Trend('request_duration_ms', true);
```

**Código implementado - Coleta de Dados**:
```javascript
// Dentro do fluxo de registro
const response = http.post(`${baseUrl}/usuarios/registro`, payload, params);
requestDuration.add(response.timings.duration); // Adiciona à métrica

// Dentro do fluxo de login
const loginResponse = http.post(`${baseUrl}/usuarios/login`, loginPayload, loginParams);
requestDuration.add(loginResponse.timings.duration); // Adiciona à métrica

// Dentro do fluxo autenticado
const contactResponse = http.get(`${baseUrl}/contatos`, authParams);
requestDuration.add(contactResponse.timings.duration); // Adiciona à métrica
```

**Explicação**: 
- A Trend coleta o tempo de duração de cada requisição
- Você pode visualizar estatísticas: min, max, média, percentis
- Aparece nos resultados do teste com análise detalhada

---

### 5. **Helpers** (Funções Reutilizáveis)

**Helpers** são funções reutilizáveis que encapsulam lógica comum, evitando repetição de código e facilitando manutenção. Podem ser usados em múltiplos testes.

**Arquivo**: `helpers/` (3 arquivos)

**Helper 1 - Geração de Email**:
```javascript
// arquivo: helpers/emailGenerator.js
export function generateRandomEmail() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 10000);
  return `usuario${timestamp}${randomNum}@test.com`;
}

// Uso no teste:
const email = generateRandomEmail(); // Gera email único a cada iteração
```

**Helper 2 - Obtenção de URL Base**:
```javascript
// arquivo: helpers/baseUrl.js
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}

// Uso no teste:
const baseUrl = getBaseUrl(); // Obtém URL da variável de ambiente ou valor padrão
```

**Helper 3 - Login com Token**:
```javascript
// arquivo: helpers/loginHelper.js
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
    return response.json('token'); // Retorna apenas o token
  }
  
  return null;
}

// Uso no teste (apesar de não estar sendo usado, está disponível):
// const token = performLogin('usuario1', 'senha123');
```

**Explicação**: 
- Cada helper tem responsabilidade única
- Reutilizável em outros testes
- Reduz duplicação de código
- Facilita manutenção futura

---

### 6. **Variáveis de Ambiente**

**Variáveis de Ambiente** permitem parametrizar testes sem alterar o código. Útil para executar o mesmo teste em diferentes ambientes.

**Arquivo**: `helpers/baseUrl.js`

**Código implementado - Obtendo Variável**:
```javascript
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}
```

**Código implementado - Usando a Função**:
```javascript
// No arquivo performance.js
import { getBaseUrl } from './helpers/baseUrl.js';

const baseUrl = getBaseUrl(); // Obtém URL da variável de ambiente
```

**Exemplos de uso**:
```bash
# Com URL padrão
k6 run test/k6/performance.js

# Com URL customizada
k6 run --env BASE_URL=http://seu-servidor:3000 test/k6/performance.js

# Com URL de produção
k6 run --env BASE_URL=https://api.producao.com test/k6/performance.js
```

**Explicação**: 
- `__ENV.BASE_URL` acessa a variável passada por linha de comando
- Se não for passada, usa valor padrão `http://localhost:3000`
- Permite testar múltiplos ambientes com mesmo código

---

### 7. **Data-Driven Testing**

**Data-Driven Testing** utiliza dados diferentes para cada iteração/VU, simulando cenários variados e evitando que todos os usuários façam exatamente o mesmo.

**Arquivo**: `performance.js` (dentro do grupo de Registro)

**Código implementado - Geração de Dados Dinâmicos**:
```javascript
group('Fluxo de Registro', () => {
  // Gera email único a cada iteração
  const email = generateRandomEmail();
  
  // Gera login único baseado em timestamp
  const loginUser = `user_${Date.now()}`;
  
  // Cada VU usa dados diferentes
  const payload = JSON.stringify({
    nome: 'Usuário Teste',
    telefone: '51999999999',
    email: email,           // Email diferente a cada iteração
    login: loginUser,       // Login diferente a cada iteração
    senha: 'senha123'
  });

  // ... resto do código
});
```

**Explicação**: 
- Cada iteração do teste usa email e login diferentes
- Com 10 VUs rodando por 15 segundos, gera-se múltiplos conjuntos de dados
- Simula melhor um cenário real onde diferentes usuários se registram

---

### 8. **Reaproveitamento de Resposta**

**Reaproveitamento de Resposta** extrai dados de uma resposta para usar em requisições posteriores, simulando fluxos reais onde uma ação depende do resultado anterior.

**Arquivo**: `performance.js` (linhas 56-64, 90-96)

**Código implementado - Fluxo de Registro**:
```javascript
const response = http.post(`${baseUrl}/usuarios/registro`, payload, params);

// Reaproveitamento: Extrai dados da resposta anterior
if (response.status === 201) {
  const responseBody = response.json();
  const usuarioRegistrado = responseBody.usuario; // Extrai o usuário registrado
  
  // Usa os dados do usuário para o próximo passo (login)
  group('Fluxo de Login', () => {
    const loginPayload = JSON.stringify({
      login: loginUser,
      senha: 'senha123'
    });
    // ... continua com login do usuário registrado
  });
}
```

**Código implementado - Fluxo de Login**:
```javascript
const loginResponse = http.post(`${baseUrl}/usuarios/login`, loginPayload, loginParams);

// Reaproveitamento: Extrai token da resposta de login
if (loginResponse.status === 200) {
  const loginBody = loginResponse.json();
  const token = loginBody.token; // Extrai o token JWT
  
  // Usa o token em requisição autenticada
  group('Fluxo de Atividade Autenticada', () => {
    const authParams = {
      headers: {
        'Authorization': `Bearer ${token}` // Usa token extraído
      }
    };
    
    const contactResponse = http.get(`${baseUrl}/contatos`, authParams);
    // ... usa o token para acessar recurso protegido
  });
}
```

**Explicação**: 
- Simula fluxo real: registrar → logar → usar token para acessar dados
- Extrai dados da resposta anterior (token JWT)
- Valida que a API retorna dados no formato esperado

---

### 9. **Uso de Token de Autenticação**

**Token de Autenticação** (JWT) é incluído no header `Authorization` para acessar recursos protegidos, validando que a autenticação funciona corretamente sob carga.

**Arquivo**: `performance.js` (linhas 93-98)

**Código implementado**:
```javascript
group('Fluxo de Atividade Autenticada', () => {
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Token JWT no header
    }
  };

  const contactResponse = http.get(`${baseUrl}/contatos`, authParams);

  check(contactResponse, {
    'Listar Contatos: Status code é 200': (r) => r.status === 200,
    'Listar Contatos: Response é um array': (r) => Array.isArray(r.json()),
  });
});
```

**Fluxo de Token**:
```
1. Faz login → recebe token JWT
2. Inclui token no header Authorization
3. Faz requisição GET /contatos com token
4. Valida que a resposta é bem-sucedida (200)
```

**Explicação**: 
- Token JWT extraído do login é usado em requisições subsequentes
- Header `Authorization` com formato `Bearer {token}`
- Valida que endpoints protegidos funcionam corretamente com autenticação

---

### 10. **Groups** (Agrupamento de Ações)

**Groups** organizam ações logicamente e geram métricas separadas para cada grupo, facilitando identificar qual parte do teste está lenta.

**Arquivo**: `performance.js` (múltiplas ocorrências)

**Código implementado - Estrutura de Groups**:
```javascript
export default function () {
  // Group 1: Fluxo de Registro
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
    
    requestDuration.add(response.timings.duration);

    check(response, {
      'Registro: Status code é 201': (r) => r.status === 201,
      'Registro: Response contém mensagem': (r) => r.body.includes('Usuário registrado com sucesso'),
    });

    if (response.status === 201) {
      const responseBody = response.json();

      // Group 2: Fluxo de Login (aninhado)
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

        requestDuration.add(loginResponse.timings.duration);

        check(loginResponse, {
          'Login: Status code é 200': (r) => r.status === 200,
          'Login: Response contém token': (r) => r.body.includes('token'),
          'Login: Response contém mensagem de sucesso': (r) => r.body.includes('Login realizado com sucesso'),
        });

        if (loginResponse.status === 200) {
          const loginBody = loginResponse.json();
          const token = loginBody.token;

          // Group 3: Fluxo de Atividade Autenticada (aninhado)
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
      });
    }
  });
}
```

**Resultado esperado nos logs**:
```
group_duration{group:::Fluxo de Registro}....: avg=250ms min=150ms med=230ms max=500ms p(95)=450ms
group_duration{group:::Fluxo de Login}........: avg=120ms min=80ms  med=110ms max=300ms p(95)=200ms
group_duration{group:::Fluxo de Atividade...}: avg=100ms min=50ms  med=95ms  max=250ms p(95)=180ms
```

**Explicação**: 
- **Fluxo de Registro**: Agrupa todas as ações de registro
- **Fluxo de Login**: Agrupa todas as ações de autenticação
- **Fluxo de Atividade Autenticada**: Agrupa ações que requerem token
- Cada group gera métricas separadas, facilitando identificação de gargalos
- Groups podem ser aninhados (um dentro do outro)
- Ajuda na compreensão e análise de qual parte do teste está lenta

## 📈 Fluxo de Teste

O teste segue um fluxo principal que simula um cenário de uso real:

```
┌─────────────────┐
│  Fluxo Principal│
└────────┬────────┘
         │
    ┌────▼─────────────────────┐
    │ Fluxo de Registro        │
    │ - POST /usuarios/registro│
    │ - Validar status 201     │
    └────┬─────────────────────┘
         │
    ┌────▼─────────────────────┐
    │ Fluxo de Login           │
    │ - POST /usuarios/login   │
    │ - Extrair token JWT      │
    │ - Validar status 200     │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ Fluxo Autenticado            │
    │ - GET /contatos (com token)  │
    │ - Validar status 200         │
    └──────────────────────────────┘
```

## ✅ Requisitos de Sucesso

O teste é considerado bem-sucedido quando:

1. **Threshold Atendido**: Percentil 95 do tempo de resposta < 2000ms
2. **Taxa de Falha Aceitável**: Menos de 10% de requisições falhadas
3. **Todos os Checks Passam**: Validações de status code e conteúdo de resposta

## 📝 Exemplo de Resultado

```
✓ Registro: Status code é 201
✓ Registro: Response contém mensagem
✓ Login: Status code é 200
✓ Login: Response contém token
✓ Login: Response contém mensagem de sucesso
✓ Listar Contatos: Status code é 200
✓ Listar Contatos: Response é um array

checks.........................: 100% (500/500)
http_req_duration..............: avg=150ms min=45ms med=120ms max=450ms p(95)=350ms
http_req_failed................: 0%
iterations......................: 50
vus............................: 10
```

## 🔧 Troubleshooting

### Erro: "Cannot find BASE_URL"
**Solução**: Certifique-se de passar a variável de ambiente:
```bash
k6 run --env BASE_URL=http://localhost:3000 test/k6/performance.js
```

### Erro: "Connection refused"
**Solução**: Verifique se a API está rodando:
```bash
npm start  # Em outro terminal
```

### Threshold Failed
**Significado**: O percentil 95 do tempo de resposta está acima de 2 segundos
**Ação**: Analise o `report.html` para identificar gargalos

## 📚 Recursos Adicionais

- [Documentação K6](https://k6.io/docs/)
- [K6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [HTTP Methods in K6](https://k6.io/docs/javascript-api/k6-http/)

---

**Última atualização**: 15 de dezembro de 2025
