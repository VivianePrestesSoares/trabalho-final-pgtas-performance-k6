const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = 'segredo_super_secreto';

// Registro de usuário
router.post('/registro', (req, res) => {
  const { usuario, erro } = userService.registrarUsuario(req.body);
  if (erro) return res.status(400).json({ mensagem: erro });
  res.status(201).json({ mensagem: 'Usuário registrado com sucesso.', usuario });
});

// Login
router.post('/login', (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) {
    return res.status(400).json({ mensagem: 'Login e senha são obrigatórios.' });
  }
  const { usuario, erro } = userService.autenticarUsuario(login, senha);
  if (erro) return res.status(401).json({ mensagem: erro });
  const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ mensagem: 'Login realizado com sucesso.', token });
});

// Listar usuários
router.get('/', (req, res) => {
  const usuarios = userService.listarUsuarios();
  res.json(usuarios);
});

module.exports = router;
