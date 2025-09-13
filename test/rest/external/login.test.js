const request = require('supertest');
const { expect } = require('chai');

describe('Testes de Login', () => {
    it('Deve registrar um usuario com sucesso', async () => {
        const resposta  = await request('http://localhost:3000')    
            .post('/usuarios/registro')  
            .send({ 
                nome: 'usuario2', 
                telefone: '51992413404',
                email: 'usuario2@gmail.com', 
                login: 'usuario2',
                senha: 'senha123' 
            });

        expect(resposta.status).to.equal(201);
        expect(resposta.body).to.have.property('mensagem', 'Usuário registrado com sucesso.');
    })

});

  