# API Agenda de Contatos

Esta é uma API REST para gerenciamento de usuários e contatos, desenvolvida em Node.js com Express. Os dados são armazenados em memória (variáveis), ideal para estudos de testes e automação de APIs.

## Funcionalidades
- Registro de usuários (nome, telefone, email, login, senha)
- Login de usuários (JWT)
- Listagem de usuários
- CRUD de contatos (apenas para usuários autenticados)
- Validações e mensagens em português
- Documentação Swagger disponível

## Regras de Negócio
1. Login e senha obrigatórios para autenticação
2. Não permite registro de usuários duplicados
3. Não permite cadastro de usuário sem todos os campos preenchidos
4. Apenas usuários autenticados podem gerenciar contatos
5. É possível deletar contatos

## Instalação
1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install express jsonwebtoken bcryptjs swagger-ui-express
   ```
3. Inicie o servidor:
   ```bash
   node server.js
   ```

## Endpoints Principais
- `POST /usuarios/registro` — Registro de usuário
- `POST /usuarios/login` — Login (retorna token JWT)
- `GET /usuarios` — Lista todos os usuários
- `POST /contatos` — Cria contato (autenticado)
- `GET /contatos` — Lista contatos do usuário autenticado
- `PUT /contatos/:id` — Atualiza contato (autenticado)
- `DELETE /contatos/:id` — Deleta contato (autenticado)

## Autenticação
Inclua o token JWT retornado no login no header:
```
Authorization: Bearer <token>
```

## Documentação Swagger
Acesse a documentação interativa em: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Testes de Performance com K6

### Como Executar

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

### Relatório de Teste (HTML)

Este relatório não é nativo do K6. Ele é gerado pela biblioteca externa **k6-reporter**, que transforma os dados coletados pelo K6 em um arquivo HTML visual e em JSON detalhado, facilitando a análise de métricas de desempenho, latência e sucesso das requisições.

**Como gerar o relatório:**
1. Execute o teste com saída JSON:
   ```bash
   npm run k6:run
   ```

2. Gere o relatório HTML:
   ```bash
   npm run k6:report
   ```

3. O arquivo `report.html` será criado em `test/k6/report.html`

**Arquivos gerados:**
- `test/k6/results.json` — Dados brutos do teste em JSON
- `test/k6/results.csv` — Dados brutos do teste em CSV
- `test/k6/report.html` — Relatório visual interativo

O relatório HTML contém:
- ✅ Métricas de desempenho (tempo médio, mínimo, máximo, p95)
- ✅ Status do threshold (se atendeu o requisito p95 < 2 segundos)
- ✅ Total de requisições e taxa de sucesso
- ✅ Resultados detalhados de cada check realizado
- ✅ Visualização clara e responsiva

### Conceitos K6 Implementados

#### 1. **Stages** (Estágios de Carga)
- **Arquivo**: `test/k6/performance.js` (linhas 15-20)
- **Descrição**: Configuração de ramp-up e ramp-down de usuários virtuais
- **Implementação**: 
  - 10 segundos de subida até 10 VUs
  - 5 segundos mantendo 10 VUs

#### 2. **Thresholds** (Limites de Sucesso)
- **Arquivo**: `test/k6/performance.js` (linhas 21-24)
- **Descrição**: Critérios que o teste deve atender para passar
- **Implementação**:
  - `p(95) < 2000`: Percentil 95 do tempo de resposta menor que 2 segundos
  - `rate<0.1`: Taxa de falha menor que 10%

#### 3. **Checks** (Validações)
- **Arquivo**: `test/k6/performance.js` (múltiplas ocorrências)
- **Descrição**: Validações específicas de cada resposta
- **Implementação**: 
  - Verificação de status codes (201, 200)
  - Validação de conteúdo de resposta
  - Exemplo: `check(response, { 'Registro: Status code é 201': (r) => r.status === 201 })`

#### 4. **Trends** (Métricas Customizadas)
- **Arquivo**: `test/k6/performance.js` (linhas 11-12)
- **Descrição**: Métrica para monitorar duração das requests
- **Implementação**:
  ```javascript
  const requestDuration = new Trend('request_duration_ms', true);
  requestDuration.add(response.timings.duration);
  ```

#### 5. **Helpers** (Funções Reutilizáveis)
- **Diretório**: `test/k6/helpers/`
- **Arquivos**:
  - `emailGenerator.js`: Função `generateRandomEmail()` para criar emails únicos
  - `baseUrl.js`: Função `getBaseUrl()` para obter URL base via variável de ambiente
  - `loginHelper.js`: Função `performLogin()` para fazer login e retornar token

#### 6. **Variáveis de Ambiente**
- **Arquivo**: `test/k6/helpers/baseUrl.js`
- **Descrição**: Uso de `__ENV.BASE_URL` para parametrizar a URL base
- **Uso**: Passada via CLI com `--env BASE_URL=http://seu-servidor:3000`

#### 7. **Data-Driven Testing**
- **Arquivo**: `test/k6/performance.js` (dentro do grupo de Registro)
- **Descrição**: Uso de dados dinâmicos para cada iteração
- **Implementação**:
  - Email aleatório gerado em cada iteração com `generateRandomEmail()`
  - Login único baseado em timestamp com `user_${Date.now()}`

#### 8. **Reaproveitamento de Resposta**
- **Arquivo**: `test/k6/performance.js` (linhas 61-64, 95-96)
- **Descrição**: Extração de dados da resposta anterior para usar na próxima request
- **Implementação**:
  - Token JWT extraído da resposta de login: `const token = loginBody.token`
  - Token reutilizado em requisições autenticadas

#### 9. **Uso de Token de Autenticação**
- **Arquivo**: `test/k6/performance.js` (linhas 93-98)
- **Descrição**: Inclusão do token JWT no header Authorization
- **Implementação**:
  ```javascript
  const authParams = {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  ```

#### 10. **Groups** (Agrupamento de Ações)
- **Arquivo**: `test/k6/performance.js` (múltiplas ocorrências)
- **Descrição**: Organização lógica das ações em grupos
- **Implementação**:
  - `Fluxo de Registro`: Agrupa ações de registro do usuário
  - `Fluxo de Login`: Agrupa ações de autenticação
  - `Fluxo de Atividade Autenticada`: Agrupa ações que requerem token

### Arquivos de Teste
- **Script Principal**: `test/k6/performance.js`
- **Helpers**: `test/k6/helpers/emailGenerator.js`, `test/k6/helpers/baseUrl.js`, `test/k6/helpers/loginHelper.js`
- **Gerador de Relatório**: `test/k6/generateReport.js`

## Integração Contínua (CI/CD)
Esta aplicação já possui pipeline de CI/CD configurada com GitHub Actions. A cada push ou pull request na branch `main`, os testes automatizados serão executados automaticamente.

O workflow está em `.github/workflows/ci.yml`.

## Observações
- O banco de dados é volátil (em memória). Ao reiniciar, os dados são perdidos.
- O arquivo `app.js` pode ser importado para testes automatizados (ex: Supertest).

----

Desenvolvido para fins didáticos.
