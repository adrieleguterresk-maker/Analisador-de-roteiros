// --- AJUSTE NATIVO VERCEL ---
// Polyfills indispensáveis para pdf-parse (pdf.js) em ambiente serverless
global.DOMMatrix = class {};
global.DOMMatrixReadOnly = class {};
// ---------------------------

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const analiseController = require('./controllers/analiseController');
const extrairController = require('./controllers/extrairController');
const historicoController = require('./controllers/historicoController');

dotenv.config();

const app = express();

// Configuração de Memória para Uploads (Essencial para Vercel)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware de Limite de Dados (Payload 20MB)
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Rota de Diagnóstico Vercel
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      openai: !!process.env.OPENAI_API_KEY,
      supabase: !!process.env.SUPABASE_URL
    }
  });
});

// Rotas de Serviço
app.post('/api/extrair', upload.single('file'), extrairController.extrairTexto);
app.post('/api/analisar', upload.single('file'), analiseController.processarAnalise);
app.get('/api/historico', historicoController.listarHistorico);
app.get('/api/historico/:id', historicoController.detalheAnalise);
app.delete('/api/historico/:id', historicoController.excluirAnalise);

// PADRÃO VERCEL: Exportar o app em vez de dar .listen()
module.exports = app;

// Caso queira rodar localmente, o comando npm run dev continuará funcionando
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[LOCAL] Servidor backend rodando na porta ${PORT}`);
  });
}
