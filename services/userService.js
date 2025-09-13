const usuarios = require('../models/userModel');
const bcrypt = require('bcryptjs');

function validarDadosUsuario({ nome, telefone, email, login, senha }) {
  if (!nome || !telefone || !email || !login || !senha) {
    return 'Todos os campos devem ser preenchidos.';
  }
  return null;
}

function usuarioExistente(login, email) {
  return usuarios.find(u => u.login === login || u.email === email);
}

function registrarUsuario(dados) {
  const erro = validarDadosUsuario(dados);
  if (erro) return { erro };
  if (usuarioExistente(dados.login, dados.email)) {
    return { erro: 'Usuário já cadastrado.' };
  }
  const hash = bcrypt.hashSync(dados.senha, 8);
  const novoUsuario = { ...dados, senha: hash, id: Date.now().toString() };
  usuarios.push(novoUsuario);
  return { usuario: { ...novoUsuario, senha: undefined } };
}

function autenticarUsuario(login, senha) {
  const usuario = usuarios.find(u => u.login === login);
  if (!usuario) return { erro: 'Login ou senha inválidos.' };
  if (!bcrypt.compareSync(senha, usuario.senha)) {
    return { erro: 'Login ou senha inválidos.' };
  }
  return { usuario };
}

function listarUsuarios() {
  return usuarios.map(u => ({ ...u, senha: undefined }));
}

module.exports = { registrarUsuario, autenticarUsuario, listarUsuarios };
