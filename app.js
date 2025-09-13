// Configuração principal do Express e middlewares
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const userRoutes = require('./controllers/userController');
const contactRoutes = require('./controllers/contactController');
const app = express();

app.use(express.json());

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rotas
app.use('/usuarios', userRoutes);
app.use('/contatos', contactRoutes);

// Middleware para rota não encontrada
app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

module.exports = app;
