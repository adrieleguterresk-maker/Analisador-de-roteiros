const axios = require('axios');
const instagramGetUrl = require('instagram-url-direct');

/**
 * Captura o áudio/vídeo de um Reel através de Scraping de Rede (sem binários yt-dlp)
 * Ideal para ambientes como Vercel (Serverless)
 */
async function downloadAudioFromReel(url) {
  try {
    console.log('--- INICIANDO CAPTURA DE VÍDEO VIA REDE ---');
    
    // 1. Tenta capturar a URL direta da mídia
    const links = await instagramGetUrl(url);
    
    if (!links || !links.url_list || links.url_list.length === 0) {
      throw new Error('Não foi possível extrair o link direto do vídeo. Verifique se o perfil é público.');
    }

    // Pega o primeiro link de mídia disponível (geralmente MP4)
    const directUrl = links.url_list[0];
    console.log('Link direto capturado com sucesso.');

    // 2. Faz o download da mídia para um Buffer (memória)
    const response = await axios({
      method: 'get',
      url: directUrl,
      responseType: 'arraybuffer',
      timeout: 15000 // Limite de 15 segundos para download
    });

    console.log('Download da mídia concluído (em memória). Tamanho:', response.data.byteLength, 'bytes');

    // Retorna o buffer e o tipo para o Whisper
    return {
      buffer: Buffer.from(response.data),
      name: 'video_reel.mp4'
    };

  } catch (error) {
    console.error('Erro na captura de mídia:', error.message);
    throw new Error(`Falha ao processar o link do vídeo: ${error.message}`);
  }
}

// No-op para compatibilidade (não temos mais arquivos em disco para deletar)
function cleanupAudio(filePath) {
  // Nada a fazer com Buffers em memória
}

module.exports = {
  downloadAudioFromReel,
  cleanupAudio
};
