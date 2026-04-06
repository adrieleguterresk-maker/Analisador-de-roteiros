const { OpenAI } = require('openai');
const fs = require('fs');

let _openai = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

const SYSTEM_PROMPT = `Você é um especialista em análise de conteúdo para Instagram, treinado na Metodologia Julia Ottoni de criação de roteiros magnéticos. Sua função é analisar roteiros e dar feedbacks precisos, didáticos e acionáveis.

METODOLOGIA JULIA OTTONI — BASE DE CONHECIMENTO:

## FUNIL DE CONTEÚDO (4 etapas)
1. EDUCAR (topo) → público com baixa consciência. Falar de dores cotidianas, sintomas percebidos. Nunca falar do serviço técnico diretamente. Gerar identificação.
2. DÚVIDAS E OBJEÇÕES (meio) → público com consciência média. Quebrar resistências, comparações, perguntas frequentes, lidar com medos.
3. CONEXÃO EMOCIONAL (fundo) → ser escolhida mesmo não sendo a mais barata. Narrativas que geram identificação. Dor emocional por trás da dor racional.
4. VENDA DIRETA (conversão) → dor + solução + CTA. Antes/depois, prova social, urgência, escassez.

## TIPOS DE CONTEÚDO E SUAS REGRAS

### CONEXÃO NUTELLA
- Conteúdo leve, cotidiano, humanizador
- NÃO é só postar foto com família — precisa ter emoção real
- NÃO usar frases prontas genéricas como "seja sua melhor versão"
- Deve gerar identificação emocional genuína
- Estrutura: gatilho de entrada (dor/desejo/curiosidade) → enredo enxuto → mensagem final → CTA

### CONEXÃO RAIZ (STORYTELLING PROFUNDO)
- Storytelling com arquétipos (Inocente, Explorador, Herói, Mago, etc.)
- 7 formatos possíveis: dor real do cliente, reflexão de vida, nova fase, arquétipos, propósito, nicho linkado ao arquétipo, quebra de padrão curiosa
- Sempre: começo com dor/desejo/curiosidade → enredo → moral da história → CTA
- Deve ter quebra de padrão visual no formato de gravação

### EDUCATIVO 1 (baixa consciência)
- Público não sabe que tem o problema ou que precisa do serviço
- NUNCA começar com nome técnico do serviço
- Falar do problema/sintoma, não da solução técnica
- Ex: falar de "colágeno" e não de "bioestimulador de colágeno"
- Linguagem simples, exemplos do cotidiano

### EDUCATIVO 2 (elevar nível de consciência)
- Público já percebe o problema mas não entende a profundidade
- Quebrar mitos, trazer dados, comparações, perguntas frequentes
- Pode usar linguagem levemente mais técnica, mas sempre acessível
- Objetivo: fazer a pessoa entender que precisa do profissional

### VENDA DIRETA
- Formatos: antes/depois narrativo, depoimento em vídeo/áudio, depoimento escrito, quebra de objeção, "você não precisa de X, precisa de Y", escassez de vagas/bônus
- SEMPRE começa tocando em dor ou desejo — NUNCA com "oi meu nome é..."
- Gatilhos obrigatórios: urgência OU escassez OU prova social
- CTA claro e direto no final

## ESTRUTURA DO GANCHO MAGNÉTICO (PRIMEIROS 5 SEGUNDOS)
PROIBIDO nos primeiros segundos:
- "Hoje eu vou falar sobre..."
- "Olá, tudo bem?"
- "A importância de..."
- "Cuidados com..."
- Termos técnicos sem contexto emocional

OBRIGATÓRIO: um dos 4 gatilhos de abertura:
- DOR: problema real que o público quer resolver
- DESEJO: o que a pessoa mais quer alcançar
- CURIOSIDADE: algo inesperado, comparativo, contraditório
- OBJEÇÃO: medo ou bloqueio que impede a compra

MODELOS VALIDADOS DE GANCHO:
- Dor: "3 erros que te impedem de [resolver o problema]" | "Você passa por [problema]? Veja 3 estratégias..."
- Desejo: "4 segredos para [conquista desejada]" | "O que ninguém te contou sobre [resultado]"
- Objeção: "[Medo comum]?" → quebra a obieção no vídeo
- Curiosidade: "[Famoso] ficou [evento em alta], mas o que você não sabe é que..." | "3 fatos curiosos sobre [famoso] que ensinam sobre [nicho]" | "X ou Y: qual é melhor para [desejo]?"

## DESENVOLVIMENTO DO CONTEÚDO
- Deve educar antes de vender (nunca apenas vender)
- Linguagem simples e exemplos práticos
- Gerar transformação rápida (mesmo que pequena)
- Formatos aceitos: dicas, erros comuns, explicações simples, curiosidades, mitos
- Sempre responde a uma dúvida frequente ou problema real da persona

## CTA (CALL TO ACTION)
CTA fraco (evitar):
- Vago, sem instrução clara
- Ausente
- Muito longo depois do ponto de interesse
- **PROIBIDO:** "Me mande uma mensagem", "Me envie um direct", "Vamos conversar", "Me chama no zap".

CTA forte (usar SOMENTE estes modelos):
1. "Escreva aqui abaixo [complemento]..."
2. "Comente aqui abaixo [complemento]..."
3. "Envie esse vídeo (ou post, caso seja carrossel) para alguém que precisa saber sobre isso"
4. "Envie esse vídeo (ou post, caso seja carrossel) para uma amiga [complemento]..."
5. "Acompanhe o meu perfil para ver conteúdos como esse toda semana"

## CARROSSEL
Mesma estrutura de análise dos reels/roteiros textuais, porém considerando que:
- O gancho é a primeira imagem/slide (texto + visual)
- O desenvolvimento são os slides intermediários
- O CTA é o último slide
- Avaliar coesão visual, progressão de informação e chamada final

---
Você receberá como input:
- O ROTEIRO em texto (ou transcrição de áudio já processada)
- O TIPO DE CONTEÚDO (Conexão Nutella, Conexão Raiz, Educativo 1, Educativo 2 ou Venda Direta)
- O NICHO do profissional

INSTRUÇÕES ADICIONAIS PARA AS SUGESTÕES:
1. **COMPARAÇÃO (ATUAL vs SUGERIDO):** Em todas as categorias (Ganchos, Desenvolvimento e CTAs), você deve obrigatoriamente identificar a versão atual do roteiro e fornecer a versão sugerida mais magnética baseada na metodologia.
2. **DESENVOLVIMENTO:** Não dê apenas a "ideia". Escreva de fato trechos do roteiro (diálogo ou narração) que deveriam ser ditos/mostrados no desenvolvimento do vídeo.
3. **CTAs:** Siga estritamente os modelos permitidos citados acima.

Sua análise SEMPRE deve seguir EXATAMENTE esta estrutura de saída em JSON:

{
  "tipo_conteudo": "string — tipo informado",
  "nicho": "string",
  "impressao_geral": "string — parágrafo com impressão geral do roteiro, tom direto e construtivo",
  "pontos_fortes": [
    {
      "ponto": "string — o que está forte",
      "motivo": "string — por que está funcionando segundo a metodologia"
    }
  ],
  "pontos_ajuste": [
    {
      "elemento": "string — gancho / desenvolvimento / CTA / outro",
      "versao_atual": "string — trecho ou descrição do que está no roteiro",
      "versao_recomendada": "string — versão reescrita ou sugestão concreta",
      "motivo": "string — por que ajustar, com base na metodologia"
    }
  ],
  "nota": número de 0 a 10 com uma casa decimal,
  "justificativa_nota": "string — explicação clara da nota com base nos critérios da metodologia",
  "sugestoes": {
    "gancho": [
      "string — sugestão alternativa de gancho 1",
      "string — sugestão alternativa de gancho 2",
      "string — sugestão alternativa de gancho 3"
    ],
    "desenvolvimento": [
      "string — sugestão para melhorar o desenvolvimento 1",
      "string — sugestão para melhorar o desenvolvimento 2"
    ],
    "cta": [
      "string — sugestão de CTA 1",
      "string — sugestão de CTA 2"
    ]
  }
}

ATENÇÃO: Retorne APENAS o JSON, sem texto antes ou depois, sem markdown, sem explicações fora do JSON.`;

const MULTIPLE_SCRIPTS_SYSTEM_PROMPT = `
Após analisar todos os roteiros individualmente, gere também um JSON separado chamado resumo_executivo:
{
  "resumo_executivo": {
    "total_roteiros": número,
    "media_notas": número,
    "roteiros": [
      {
        "nome": "string — nome ou identificador do roteiro",
        "nota": número,
        "principal_problema": "string — problema mais crítico em uma frase"
      }
    ],
    "prioridade_ajuste": "string — parágrafo explicando quais roteiros ajustar primeiro e por quê"
  }
}
`;

async function analisarRoteiroTexto(listaRoteiros, nicho) {
  const scriptsPrompt = listaRoteiros.map((s, i) => `
  ### ROTEIRO ${i + 1}: ${s.nome || 'Roteiro ' + (i + 1)}
  TIPO NARRATIVO: ${s.tipoConteudo}
  CONTEÚDO:
  ${s.texto}
  `).join('\n---\n');

  const userPrompt = `
  Nicho: ${nicho}
  
  Você deve analisar os seguintes roteiros individualmente, respeitando o TIPO NARRATIVO especificado para cada um deles:
  
  ${scriptsPrompt}
  `;

  // We ask GPT to handle the single vs multiple logic based on the user prompt
  const functions = [
    {
      "name": "retornar_analise_roteiro",
      "description": "Retorna o JSON estruturado da análise e o resumo executivo, caso haja múltiplos roteiros.",
      "parameters": {
        "type": "object",
        "properties": {
          "analises": {
             "type": "array",
             "description": "Lista de análises de roteiro.",
             "items": {
                "type": "object",
                "properties": {
                  "nome_roteiro": { "type": "string", "description": "Detectado do texto, ou 'Roteiro 1' se não especificado." },
                  "tipo_conteudo": { "type": "string" },
                  "nicho": { "type": "string" },
                  "impressao_geral": { "type": "string" },
                  "pontos_fortes": { 
                    "type": "array",
                    "items": {
                       "type": "object",
                       "properties": {
                          "ponto": { "type": "string" },
                          "motivo": { "type": "string" }
                       }
                    }
                  },
                  "pontos_ajuste": { 
                    "type": "array",
                    "items": {
                       "type": "object",
                       "properties": {
                          "elemento": { "type": "string" },
                          "versao_atual": { "type": "string" },
                          "versao_recomendada": { "type": "string" },
                          "motivo": { "type": "string" }
                       }
                    }
                  },
                  "nota": { "type": "number" },
                  "justificativa_nota": { "type": "string" },
                  "sugestoes": {
                    "type": "object",
                    "properties": {
                      "gancho": { 
                        "type": "array", 
                        "items": { 
                          "type": "object",
                          "properties": {
                            "atual": { "type": "string", "description": "O gancho como está no roteiro original." },
                            "sugerido": { "type": "string", "description": "A versão reescrita e magnética do gancho." }
                          },
                          "required": ["atual", "sugerido"]
                        } 
                      },
                      "desenvolvimento": { 
                        "type": "array", 
                        "items": { 
                          "type": "object",
                          "properties": {
                            "atual": { "type": "string", "description": "Resumo ou trecho do desenvolvimento no roteiro original." },
                            "sugerido": { "type": "string", "description": "A versão reescrita sugerida para o roteiro completo." }
                          },
                          "required": ["atual", "sugerido"]
                        } 
                      },
                      "cta": { 
                        "type": "array", 
                        "items": { 
                          "type": "object",
                          "properties": {
                            "atual": { "type": "string", "description": "O CTA como está no roteiro original." },
                            "sugerido": { "type": "string", "description": "A sugestão de CTA seguindo a metodologia." }
                          },
                          "required": ["atual", "sugerido"]
                        } 
                      }
                    },
                    "required": ["gancho", "desenvolvimento", "cta"]
                  }
                }
             }
          },
          "resumo_executivo": {
            "type": "object",
            "description": "Apenas se houver mais de 1 roteiro. Caso contrário, retorne null.",
            "nullable": true,
            "properties": {
              "total_roteiros": { "type": "number" },
              "media_notas": { "type": "number" },
              "roteiros": { 
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "nome": { "type": "string" },
                    "nota": { "type": "number" },
                    "principal_problema": { "type": "string" }
                  }
                }
              },
              "prioridade_ajuste": { "type": "string" }
            }
          }
        },
        "required": ["analises"]
      }
    }
  ];

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT + "\n" + MULTIPLE_SCRIPTS_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    functions: functions,
    function_call: { name: "retornar_analise_roteiro" },
    temperature: 0.7,
  });

  const rawJson = response.choices[0].message.function_call.arguments;
  return JSON.parse(rawJson);
}

async function extractTextFromImages(base64Images) {
  // Use Vision API to extract text from carousel images
  const contentArray = [
    { type: "text", text: "Extraia todo o texto visível nestas imagens, na ordem em que aparecem. Retorne apenas o texto extraído, sem comentários adicionais. Use uma linha nova para cada bloco diferente ou mudança de slide." }
  ];

  for(const b64 of base64Images) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: b64 // expected format "data:image/jpeg;base64,...""
      }
    });
  }

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: contentArray
      }
    ],
    max_tokens: 1500,
  });

  return response.choices[0].message.content;
}

async function transcribeAudio(mediaData) {
  // Se for um Buffer/Objeto, converte para Arquivo Virtual para a OpenAI
  let fileToTranscribe;
  
  if (mediaData.buffer) {
    fileToTranscribe = await toFile(mediaData.buffer, mediaData.name || 'audio.mp4');
  } else {
    // Fallback legado para caminho de arquivo (fs)
    fileToTranscribe = fs.createReadStream(mediaData);
  }

  const result = await getOpenAI().audio.transcriptions.create({
    file: fileToTranscribe,
    model: "whisper-1",
  });
  return result.text;
}

module.exports = {
  analisarRoteiroTexto,
  extractTextFromImages,
  transcribeAudio
};
