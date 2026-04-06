const { analisarRoteiroTexto, extractTextFromImages, transcribeAudio } = require('../services/openaiService');
const { downloadAudioFromReel, cleanupAudio } = require('../services/mediaService');
const { supabase } = require('../database/supabase');

async function extractTextFromFile(file) {
  const mimeType = file.mimetype;
  const originalName = file.originalname.toLowerCase();
  const buffer = file.buffer;

  if (mimeType === 'text/plain' || originalName.endsWith('.txt')) {
    return buffer.toString('utf-8');
  } else if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
    // pdf-parse restaurado com polyfill no server.js para estabilidade
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    return data.text;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    originalName.endsWith('.docx')
  ) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  }
  return null;
}

async function processarAnalise(req, res) {
  try {
    const { tipoInput, tipoConteudo, nicho, texto, images: imagesRaw, roteirosConfigurados: roteirosRaw } = req.body;
    
    console.log('--- INÍCIO DA ANÁLISE ---');
    
    // Verificação de segurança: O banco de dados está online?
    if (!supabase) {
      return res.status(503).json({ error: 'Erro de Configuração: O banco de dados (Supabase) não foi detectado. Verifique as variáveis no painel da Vercel.' });
    }
    
    console.log('Tipo Input:', tipoInput);
    console.log('Nicho:', nicho);
    
    let listaRoteiros = [];
    let inputOriginal = '';
    let transcricao = null;

    console.log('--- ETAPA 1: CAPTURA DE MÍDIA ---');
    if (roteirosRaw) {
      listaRoteiros = typeof roteirosRaw === 'string' ? JSON.parse(roteirosRaw) : roteirosRaw;
      inputOriginal = `Lote de ${listaRoteiros.length} roteiros com tipos individuais.`;
    } 
    else {
      let textoAlvo = texto || '';
      inputOriginal = texto;

      if (req.file) {
        console.log('Detectado arquivo de upload.');
        const extracted = await extractTextFromFile(req.file);
        if (extracted) {
          textoAlvo = extracted;
          inputOriginal = `Arquivo: ${req.file.originalname}`;
        }
      }

      if (tipoInput === 'reel') {
        console.log('Iniciando processamento de Reel URL.');
        const mediaData = await downloadAudioFromReel(texto);
        transcricao = await transcribeAudio(mediaData);
        textoAlvo = transcricao;
        inputOriginal = texto; 
      } else if (tipoInput === 'carrossel') {
        console.log('Iniciando processamento de Carrossel.');
        const images = typeof imagesRaw === 'string' ? JSON.parse(imagesRaw) : imagesRaw;
        textoAlvo = await extractTextFromImages(images);
        inputOriginal = 'Imagens enviadas via Base64';
        transcricao = textoAlvo;
      }

      if (!textoAlvo) {
        return res.status(400).json({ error: "Nenhum texto para análise encontrado." });
      }

      listaRoteiros = [{ texto: textoAlvo, tipoConteudo, nome: 'Roteiro Principal' }];
    }

    console.log('--- ETAPA 2: CHAMADA OPENAI (IA) ---');
    const jsonAnalise = await analisarRoteiroTexto(listaRoteiros, nicho);

    const roteirosData = jsonAnalise.analises || [];
    const resumoExecutivo = jsonAnalise.resumo_executivo || null;
    
    let notaPrincipal = roteirosData.length > 0 ? roteirosData[0].nota : 0;
    if (resumoExecutivo && resumoExecutivo.media_notas !== undefined) {
       notaPrincipal = resumoExecutivo.media_notas;
    }

    console.log('--- ETAPA 3: GRAVAÇÃO SUPABASE (BANCO) ---');
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

    if (analiseError) {
      console.error('ERRO ESPECÍFICO SUPABASE:', JSON.stringify(analiseError));
      throw new Error(`Falha no Banco de Dados: ${analiseError.message}`);
    }

    if (!analiseRecord) {
      throw new Error('O banco de dados não retornou o registro criado.');
    }

    const analiseId = analiseRecord.id;

    if (roteirosData.length > 1 && resumoExecutivo) {
      console.log('Gravando roteiros múltiplos no banco.');
      const inserts = roteirosData.map(roteiro => ({
        analise_id: analiseId,
        nome_roteiro: roteiro.nome_roteiro,
        nota: roteiro.nota,
        principal_problema: '',
        analise_json: roteiro
      }));

      await supabase.from('roteiros_multiplos').insert(inserts);
    }

    console.log('--- ANÁLISE CONCLUÍDA COM SUCESSO ---');
    res.json({
      id: analiseId,
      transcricao: transcricao,
      resultado: jsonAnalise,
      nota: notaPrincipal
    });

  } catch (error) {
    console.error('--- ERRO DETALHADO NO SERVIDOR ---');
    console.error('Mensagem:', error.message);
    console.error('Fase da Falha:', error.stack?.split('\n')[1] || 'Desconhecida');
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
