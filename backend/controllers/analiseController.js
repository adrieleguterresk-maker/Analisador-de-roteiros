const { analisarRoteiroTexto, extractTextFromImages, transcribeAudio } = require('../services/openaiService');
const { downloadAudioFromReel, cleanupAudio } = require('../services/mediaService');
const { supabase } = require('../database/supabase');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

async function extractTextFromFile(file) {
  const mimeType = file.mimetype;
  const originalName = file.originalname.toLowerCase();
  // Com memoryStorage, o conteúdo do arquivo está em file.buffer
  const buffer = file.buffer;

  if (mimeType === 'text/plain' || originalName.endsWith('.txt')) {
    return buffer.toString('utf-8');
  } else if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
    const data = await pdf(buffer);
    return data.text;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    originalName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer: buffer });
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
          // Sem fs.unlinkSync: com memoryStorage não há arquivo em disco para deletar
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

    const roteirosData = jsonAnalise.analises || [];
    const resumoExecutivo = jsonAnalise.resumo_executivo || null;
    
    let notaPrincipal = roteirosData.length > 0 ? roteirosData[0].nota : 0;
    if (resumoExecutivo && resumoExecutivo.media_notas !== undefined) {
       notaPrincipal = resumoExecutivo.media_notas;
    }

    // Inserir análise principal
    const { data: analiseRecord, error: analiseError } = await supabase
      .from('analises')
      .insert({
        tipo_input: tipoInput,
        tipo_conteudo: listaRoteiros[0].tipoConteudo,
        nicho: nicho,
        input_original: inputOriginal,
        transcricao: transcricao,
        resultado_json: jsonAnalise,
        nota: notaPrincipal
      })
      .select()
      .single();

    if (analiseError) throw analiseError;

    const analiseId = analiseRecord.id;

    // Inserir roteiros múltiplos se houver
    if (roteirosData.length > 1 && resumoExecutivo) {
      const inserts = roteirosData.map(roteiro => ({
        analise_id: analiseId,
        nome_roteiro: roteiro.nome_roteiro,
        nota: roteiro.nota,
        principal_problema: '',
        analise_json: roteiro
      }));

      const { error: multiError } = await supabase
        .from('roteiros_multiplos')
        .insert(inserts);

      if (multiError) throw multiError;
    }

    res.json({
      id: analiseId,
      transcricao: transcricao,
      resultado: jsonAnalise,
      nota: notaPrincipal
    });

  } catch (error) {
    // LOG DETALHADO PARA O USUÁRIO VER NA VERCEL
    console.error('--- ERRO DETALHADO NO SERVIDOR ---');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    if (error.response?.data) {
      console.error('Dados da OpenAI/API:', JSON.stringify(error.response.data));
    }
    console.error('----------------------------------');

    let msg = 'Erro inesperado no servidor. Tente novamente mais tarde.';
    
    // Filtros de segurança para o usuário final
    if (error.message?.includes('401') || error.message?.includes('auth') || error.status === 401) {
      msg = 'Desculpe, ocorreu uma instabilidade na autenticação dos serviços.';
    } else if (error.message?.includes('429') || error.status === 429) {
      msg = 'O serviço está com alta demanda no momento. Aguarde e tente novamente.';
    } else if (error.message?.includes('timeout') || error.status === 504) {
      msg = 'O processamento do seu roteiro demorou muito. Tente enviar um texto menor.';
    }

    res.status(500).json({ error: msg });
  }
}

module.exports = { processarAnalise };
