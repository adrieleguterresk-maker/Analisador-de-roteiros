const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

async function extractTextFromFile(file) {
  const filePath = file.path;
  const mimeType = file.mimetype;
  const originalName = file.originalname.toLowerCase();

  if (mimeType === 'text/plain' || originalName.endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8');
  } else if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    originalName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  return null;
}

async function extrairTexto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const texto = await extractTextFromFile(req.file);
    
    // Remover arquivo temporário
    fs.unlinkSync(req.file.path);

    if (!texto) {
      return res.status(400).json({ error: "Não foi possível extrair texto deste arquivo." });
    }

    res.json({ texto });

  } catch (error) {
    console.error('Erro na extração de texto:', error);
    res.status(500).json({ error: 'Erro interno ao processar o arquivo.', details: error.message });
  }
}

module.exports = { extrairTexto };
