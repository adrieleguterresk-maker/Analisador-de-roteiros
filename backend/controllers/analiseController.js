const { analisarRoteiroTexto, extractTextFromImages, transcribeAudio } = require('../services/openaiService');
const { downloadAudioFromReel, cleanupAudio } = require('../services/mediaService');
const { getDbConnection } = require('../database/database');
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

async function processarAnalise(req, res) {
  try {
    const { tipoInput, tipoConteudo, nicho, texto, images: imagesRaw, roteirosConfigurados: roteirosRaw } = req.body;
    
    console.log('--- INÍCIO DA ANÁLISE ---');
    console.log('Tipo Input:', tipoInput);
    console.log('Nicho:', nicho);
    
    let listaRoteiros = [];
    let inputOriginal = '';
    let transcricao = null;

    // Caso 1: Usuário enviou roteiros já splitados e configurados individualmente
    if (roteirosRaw) {
      listaRoteiros = typeof roteirosRaw === 'string' ? JSON.parse(roteirosRaw) : roteirosRaw;
      inputOriginal = `Lote de ${listaRoteiros.length} roteiros com tipos individuais.`;
    } 
    // Caso 2: Fluxo legado ou Reel/Carrossel (único tipo para o input)
    else {
      let textoAlvo = texto || '';
      inputOriginal = texto;

      if (req.file) {
        const extracted = await extractTextFromFile(req.file);
        if (extracted) {
          textoAlvo = extracted;
          inputOriginal = `Arquivo: ${req.file.originalname}`;
          fs.unlinkSync(req.file.path);
        }
      }

      if (tipoInput === 'reel') {
        const audioPath = await downloadAudioFromReel(texto);
        transcricao = await transcribeAudio(audioPath);
        textoAlvo = transcricao;
        inputOriginal = texto; 
        cleanupAudio(audioPath);
      } else if (tipoInput === 'carrossel') {
        const images = typeof imagesRaw === 'string' ? JSON.parse(imagesRaw) : imagesRaw;
        textoAlvo = await extractTextFromImages(images);
        inputOriginal = 'Imagens enviadas via Base64';
        transcricao = textoAlvo;
      }

      if (!textoAlvo) {
        return res.status(400).json({ error: "Nenhum texto para análise encontrado." });
      }

      // Se houver apenas um texto, encapsulamos no formato de lista
      listaRoteiros = [{ texto: textoAlvo, tipoConteudo, nome: 'Roteiro Principal' }];
    }

    const jsonAnalise = await analisarRoteiroTexto(listaRoteiros, nicho);
    const db = await getDbConnection();

    const roteirosData = jsonAnalise.analises || [];
    const resumoExecutivo = jsonAnalise.resumo_executivo || null;
    
    let notaPrincipal = roteirosData.length > 0 ? roteirosData[0].nota : 0;
    if (resumoExecutivo && resumoExecutivo.media_notas !== undefined) {
       notaPrincipal = resumoExecutivo.media_notas;
    }

    const { lastID: analiseId } = await db.run(
      `INSERT INTO analises (tipo_input, tipo_conteudo, nicho, input_original, transcricao, resultado_json, nota) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipoInput, listaRoteiros[0].tipoConteudo, nicho, inputOriginal, transcricao, JSON.stringify(jsonAnalise), notaPrincipal]
    );

    if (roteirosData.length > 1 && resumoExecutivo) {
      for (const roteiro of roteirosData) {
        await db.run(
          `INSERT INTO roteiros_multiplos (analise_id, nome_roteiro, nota, principal_problema, analise_json)
           VALUES (?, ?, ?, ?, ?)`,
          [analiseId, roteiro.nome_roteiro, roteiro.nota, '', JSON.stringify(roteiro)]
        );
      }
    }

    res.json({
      id: analiseId,
      transcricao: transcricao,
      resultado: jsonAnalise,
      nota: notaPrincipal
    });

  } catch (error) {
    console.error('ERRO INTERNO:', error.message);
    let msg = 'Falha interna durante a análise.';
    
    // Sugestão de correção conforme o tipo de erro (sem vazar a chave)
    if (error.message?.includes('401') || error.message?.includes('auth') || error.status === 401) {
      msg = 'Erro de autenticação: Verifique se sua Chave API no arquivo .env está correta e ativa.';
    } else if (error.message?.includes('429') || error.status === 429) {
      msg = 'Limite excedido ou créditos insuficientes na sua conta OpenAI.';
    }

    res.status(500).json({ error: msg });
  }
}

module.exports = { processarAnalise };
