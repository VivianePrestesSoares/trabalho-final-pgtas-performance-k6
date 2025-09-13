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

## Integração Contínua (CI/CD)
Esta aplicação já possui pipeline de CI/CD configurada com GitHub Actions. A cada push ou pull request na branch `main`, os testes automatizados serão executados automaticamente.

O workflow está em `.github/workflows/ci.yml`.

## Observações
- O banco de dados é volátil (em memória). Ao reiniciar, os dados são perdidos.
- O arquivo `app.js` pode ser importado para testes automatizados (ex: Supertest).

----

Desenvolvido para fins didáticos.
