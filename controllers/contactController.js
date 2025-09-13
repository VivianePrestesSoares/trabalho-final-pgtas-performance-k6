const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const contactService = require('../services/contactService');

const JWT_SECRET = 'segredo_super_secreto';

function autenticar(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ mensagem: 'Token não fornecido.' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ mensagem: 'Token inválido.' });
  }
}

// Criar contato
router.post('/', autenticar, (req, res) => {
  const { contato, erro } = contactService.criarContato(req.body, req.usuarioId);
  if (erro) return res.status(400).json({ mensagem: erro });
  res.status(201).json({ mensagem: 'Contato criado com sucesso.', contato });
});

// Listar contatos
router.get('/', autenticar, (req, res) => {
  const contatos = contactService.listarContatos(req.usuarioId);
  res.json(contatos);
});

// Atualizar contato
router.put('/:id', autenticar, (req, res) => {
  const { contato, erro } = contactService.atualizarContato(req.params.id, req.usuarioId, req.body);
  if (erro) return res.status(400).json({ mensagem: erro });
  res.json({ mensagem: 'Contato atualizado com sucesso.', contato });
});

// Deletar contato
router.delete('/:id', autenticar, (req, res) => {
  const { mensagem, erro } = contactService.deletarContato(req.params.id, req.usuarioId);
  if (erro) return res.status(404).json({ mensagem: erro });
  res.json({ mensagem });
});

module.exports = router;
