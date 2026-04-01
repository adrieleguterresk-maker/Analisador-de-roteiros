const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Verifica se o yt-dlp e ffmpeg estão instalados no sistema
async function downloadAudioFromReel(url) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputPath = path.join(__dirname, '..', 'temp', `audio_${timestamp}.mp3`);
    
    // Assegura que a pasta temp existe
    const tempDir = path.dirname(outputPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Comando do yt-dlp para extrair apenas áudio em formato mp3
    const command = `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erro no yt-dlp:', error);
        return reject('Falha ao baixar áudio do Reel. Verifique se yt-dlp e ffmpeg estão instalados no sistema.');
      }
      resolve(outputPath);
    });
  });
}

function cleanupAudio(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch(e) {
    console.error("Failed to delete temp audio", e);
  }
}

module.exports = {
  downloadAudioFromReel,
  cleanupAudio
};
