const { analisarRoteiroTexto } = require('./services/openaiService');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const sampleRoteiros = [
    {
      nome: 'Teste Universal',
      texto: 'Olá, hoje vou falar sobre como clarear os dentes com carvão ativado. É uma técnica barata.',
      tipoConteudo: 'Educativo 1'
    }
  ];
  
  try {
    console.log('Iniciando análise de teste universal...');
    const result = await analisarRoteiroTexto(sampleRoteiros, 'Odontologia');
    const analise = result.analises[0];
    const sugestoes = analise.sugestoes;

    console.log('--- VERIFICAÇÃO DE ESTRUTURA ---');
    
    const checkType = (cat) => {
      const item = sugestoes[cat][0];
      if (typeof item === 'object' && item.atual && item.sugerido) {
        console.log(`✅ ${cat}: Sucesso (Objeto {atual, sugerido})`);
      } else {
        console.log(`❌ ${cat}: Falha (Recebeu ${typeof item})`);
      }
    };

    checkType('gancho');
    checkType('desenvolvimento');
    checkType('cta');

    const ctaItem = sugestoes.cta[0].sugerido;
    const forbidden = ["mensagem", "conversar", "zap", "direct"];
    const isForbidden = forbidden.some(f => ctaItem.toLowerCase().includes(f));
    if (!isForbidden) {
      console.log('✅ CTA: Sucesso (Sem termos proibidos)');
    } else {
      console.log('❌ CTA: Falha (Termos proibidos detectados)');
    }

  } catch (err) {
    console.error('ERRO NO TESTE:', err);
  }
}

test();
