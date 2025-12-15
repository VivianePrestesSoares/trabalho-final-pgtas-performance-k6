const request = require('supertest');
const { expect } = require('chai');

describe('Testes de Contato', () => {
  let token;

  before(async () => {
    const resposta = await request('http://localhost:3000')
      .post('/usuarios/login')
      .send({
        login: 'usuario1',
        senha: 'senha123'
      });

    expect(resposta.status).to.equal(200);
    token = resposta.body.token;
  });

  it('Deve cadastrar um contato com sucesso', async () => {
    const resposta = await request('http://localhost:3000')
      .post('/contatos')
      .set('Authorization', 'Bearer ' + token)
      .send({
        nome: 'usuario1',
        telefone: '51992413404',
        email: 'usuario1@gmail.com'
      });

    expect(resposta.status).to.equal(201);
    expect(resposta.body).to.have.property('mensagem', 'Contato criado com sucesso.');
  });
});