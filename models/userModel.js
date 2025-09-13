// Model de Usuário (em memória)
const bcrypt = require('bcryptjs');
const usuarios = [
    {
        id: "1",
        nome: "usuario1",
        telefone: "51992413404",
        email: "usuario1@gmail.com",
        login: "usuario1",
        senha: bcrypt.hashSync('senha123', 8)
    }
];

module.exports = usuarios;

