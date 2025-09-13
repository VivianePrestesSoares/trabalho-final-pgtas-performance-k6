const contatos = require('../models/contactModel');

function validarContato({ nome, telefone, email }) {
  if (!nome || !telefone || !email) {
    return 'Todos os campos devem ser preenchidos.';
  }
  return null;
}

function criarContato(dados, usuarioId) {
  const erro = validarContato(dados);
  if (erro) return { erro };
  const novoContato = { ...dados, id: Date.now().toString(), usuarioId };
  contatos.push(novoContato);
  return { contato: novoContato };
}

function listarContatos(usuarioId) {
  return contatos.filter(c => c.usuarioId === usuarioId);
}

function atualizarContato(id, usuarioId, dados) {
  const contato = contatos.find(c => c.id === id && c.usuarioId === usuarioId);
  if (!contato) return { erro: 'Contato não encontrado.' };
  const erro = validarContato(dados);
  if (erro) return { erro };
  contato.nome = dados.nome;
  contato.telefone = dados.telefone;
  contato.email = dados.email;
  return { contato };
}

function deletarContato(id, usuarioId) {
  const index = contatos.findIndex(c => c.id === id && c.usuarioId === usuarioId);
  if (index === -1) return { erro: 'Contato não encontrado.' };
  contatos.splice(index, 1);
  return { mensagem: 'Contato deletado com sucesso.' };
}

module.exports = { criarContato, listarContatos, atualizarContato, deletarContato };
