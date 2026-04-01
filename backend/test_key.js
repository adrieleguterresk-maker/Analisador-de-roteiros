const { OpenAI } = require('openai');
require('dotenv').config();

async function testKey() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    await openai.models.list();
    console.log('Chave API válida!');
  } catch (err) {
    console.log('ERRO DE CHAVE API:');
    console.log('Status:', err.status);
    console.log('Message:', err.message);
  }
}

testKey();
