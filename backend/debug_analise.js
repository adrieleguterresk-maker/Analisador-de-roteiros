const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getDbConnection } = require('./database/database');
const analiseController = require('./controllers/analiseController');
const historicoController = require('./controllers/historicoController');
const extrairController = require('./controllers/extrairController');
const multer = require('multer');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'temp/' });

// Mimic the real routes
app.post('/api/analisar', upload.single('file'), analiseController.processarAnalise);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

async function runTestServer() {
  await getDbConnection();
  const server = app.listen(3001, async () => {
    console.log('--- TEST SERVER RUNNING ON 3001 ---');
    
    // Perform a test request to see the error
    const axios = require('axios');
    try {
      const res = await axios.post('http://localhost:3001/api/analisar', {
        tipoInput: 'texto',
        tipoConteudo: 'Venda Direta',
        nicho: 'Teste',
        texto: 'Este é um roteiro de teste para depuração.'
      });
      console.log('TEST SUCCESS:', res.data);
    } catch (err) {
      console.log('TEST FAILED:');
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Data:', JSON.stringify(err.response.data, null, 2));
      } else {
        console.log('Message:', err.message);
      }
    } finally {
      process.exit(0);
    }
  });
}

runTestServer().catch(err => {
  console.error('CRITICAL STARTUP ERROR:', err);
  process.exit(1);
});
