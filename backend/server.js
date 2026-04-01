const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const { getDbConnection } = require('./database/database');
const analiseController = require('./controllers/analiseController');
const extrairController = require('./controllers/extrairController');
const historicoController = require('./controllers/historicoController');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Multer para upload temporário
const upload = multer({ dest: 'temp/' });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas de Teste e Setup
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Rotas de Extração de Texto para confirmação do usuário
app.post('/api/extrair', upload.single('file'), extrairController.extrairTexto);

// Rotas de Análise (Aba Unificada de Roteiro aceita arquivo ou texto)
app.post('/api/analisar', upload.single('file'), analiseController.processarAnalise);

// Rotas de Histórico
app.get('/api/historico', historicoController.listarHistorico);
app.get('/api/historico/:id', historicoController.detalheAnalise);
app.delete('/api/historico/:id', historicoController.excluirAnalise);

async function startServer() {
  try {
    await getDbConnection();
    app.listen(PORT, () => {
      console.log(`Servidor backend rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('FALHA AO INICIAR SERVIDOR:', err);
    process.exit(1);
  }
}

startServer().catch(err => {
    console.error('Erro não tratado na inicialização:', err);
});
