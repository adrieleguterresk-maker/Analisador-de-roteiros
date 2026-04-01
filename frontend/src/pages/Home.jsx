import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, FileText, Image as ImageIcon, Loader2, Upload, X, Zap } from 'lucide-react';
import api from '../api';

export default function Home() {
  const [tipoInput, setTipoInput] = useState('texto');
  const [tipoConteudoGlobal, setTipoConteudoGlobal] = useState('');
  const [nicho, setNicho] = useState('');
  const [texto, setTexto] = useState('');
  const [images, setImages] = useState([]);
  const [roteiroFile, setRoteiroFile] = useState(null);
  
  // Lista de roteiros detectados
  const [listaRoteiros, setListaRoteiros] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorStatus, setErrorStatus] = useState('');

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Sincroniza a lista de roteiros quando o texto muda
  useEffect(() => {
    if (tipoInput === 'texto' || tipoInput === 'reel') {
      // Regex que aceita --- ou o travessão longo ⸻ como separadores
      const parts = texto.split(/---|\u2E3B/).map(p => p.trim()).filter(p => p.length > 0);
      
      if (parts.length > 1) {
        setListaRoteiros(prev => {
          return parts.map((p, i) => {
            const existing = prev[i];
            return {
              id: i,
              nome: `Roteiro ${i + 1}`,
              texto: p,
              tipoConteudo: existing?.tipoConteudo || tipoConteudoGlobal || ''
            };
          });
        });
      } else {
        setListaRoteiros([]);
      }
    } else {
      setListaRoteiros([]);
    }
  }, [texto, tipoInput, tipoConteudoGlobal]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    })).then(base64Files => {
      setImages(base64Files);
    });
  };

  const handleRoteiroFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRoteiroFile(file);
    }
  };

  const extrairDoArquivo = async () => {
    if (!roteiroFile) return;
    try {
      setIsExtracting(true);
      setErrorStatus('');
      const formData = new FormData();
      formData.append('file', roteiroFile);
      
      const response = await api.post('/extrair', formData);
      if (response.data && response.data.texto) {
        // Se já tiver texto, adiciona o novo texto separado por ---
        setTexto(prev => prev ? `${prev}\n---\n${response.data.texto}` : response.data.texto);
      }
    } catch (err) {
      console.error(err);
      setErrorStatus('Erro ao extrair texto do arquivo.');
    } finally {
      setIsExtracting(false);
    }
  };

  const clearRoteiroFile = () => {
    setRoteiroFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateRoteiroType = (index, type) => {
    setListaRoteiros(prev => {
      const NewList = [...prev];
      NewList[index].tipoConteudo = type;
      return NewList;
    });
  };

  const handleAnalise = async (e) => {
    e.preventDefault();
    setErrorStatus('');
    
    // Validação
    if (listaRoteiros.length > 1) {
      const incomplete = listaRoteiros.some(r => !r.tipoConteudo);
      if (incomplete) {
        setErrorStatus('Por favor, selecione a estratégia para cada um dos roteiros detectados.');
        return;
      }
    } else if (!tipoConteudoGlobal) {
      setErrorStatus('Selecione o Tipo de Conteúdo.');
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('tipoInput', tipoInput);
      formData.append('nicho', nicho);

      if (tipoInput === 'carrossel') {
        formData.append('images', JSON.stringify(images));
        formData.append('tipoConteudo', tipoConteudoGlobal);
      } else if (listaRoteiros.length > 1) {
        formData.append('roteirosConfigurados', JSON.stringify(listaRoteiros));
      } else {
        formData.append('texto', texto);
        formData.append('tipoConteudo', tipoConteudoGlobal);
        if (roteiroFile) {
          formData.append('file', roteiroFile);
        }
      }
      
      const response = await api.post('/analisar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data && response.data.id) {
        navigate(`/analise/${response.data.id}`, { state: { result: response.data } });
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Falha ao conectar com o servidor. Tente novamente mais tarde.";
      setErrorStatus(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const TIPOS_NARRATIVOS = [
    { value: "Conexão Nutella", label: "Conexão Nutella (Cotidiano/Humanização)" },
    { value: "Conexão Raiz", label: "Conexão Raiz (Storytelling Profundo)" },
    { value: "Educativo 1", label: "Educativo 1 (Baixa Consciência)" },
    { value: "Educativo 2", label: "Educativo 2 (Média Consciência)" },
    { value: "Venda Direta", label: "Venda Direta (Oferta/Prova Social)" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl text-brand-brown-dark font-display font-medium">Nova Análise Estratégica</h1>
        <p className="text-gray-600 font-body text-lg">Metodologia Julia Ottoni de Roteiros Magnéticos</p>
      </div>

      <form onSubmit={handleAnalise} className="space-y-10 card-premium">
        
        {/* Pass 1: Select Input Type */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-brand-green flex items-center gap-2">
             <span>1.</span> Formato do Conteúdo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              type="button"
              onClick={() => { setTipoInput('reel'); clearRoteiroFile(); }}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all
                ${tipoInput === 'reel' 
                  ? 'border-brand-green bg-brand-green/5 text-brand-green font-bold' 
                  : 'border-gray-200 hover:border-brand-gold text-gray-500'}`}
            >
              <Video size={32} />
              Reel (Link do Vídeo)
            </button>
            <button 
              type="button"
              onClick={() => { setTipoInput('texto'); }}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all
                ${tipoInput === 'texto' 
                  ? 'border-brand-green bg-brand-green/5 text-brand-green font-bold' 
                  : 'border-gray-200 hover:border-brand-gold text-gray-500'}`}
            >
              <FileText size={32} />
              Roteiro
            </button>
            <button 
              type="button"
              onClick={() => { setTipoInput('carrossel'); clearRoteiroFile(); }}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all
                ${tipoInput === 'carrossel' 
                  ? 'border-brand-green bg-brand-green/5 text-brand-green font-bold' 
                  : 'border-gray-200 hover:border-brand-gold text-gray-500'}`}
            >
              <ImageIcon size={32} />
              Carrossel (Imagens)
            </button>
          </div>

          <div className="pt-4 animate-fade-in">
             {tipoInput === 'reel' && (
                <input 
                  type="url" 
                  placeholder="Cole o link do Instagram/YouTube/TikTok aqui..." 
                  className="input-field"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  required
                />
             )}
             {tipoInput === 'texto' && (
                <div className="space-y-4">
                  <textarea 
                    rows="6"
                    placeholder="Cole seu roteiro aqui. Use '---' para separar roteiros diferentes." 
                    className="input-field resize-y"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    required={!roteiroFile}
                  />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <span className="text-gray-400 font-medium whitespace-nowrap">OU envie um arquivo:</span>
                    <div className="relative flex-1 w-full flex gap-2">
                       <input 
                        type="file" 
                        accept=".txt,.pdf,.docx" 
                        className="hidden" 
                        id="roteiro-file"
                        ref={fileInputRef}
                        onChange={handleRoteiroFileChange}
                      />
                      {!roteiroFile ? (
                        <label 
                          htmlFor="roteiro-file" 
                          className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-gold hover:text-brand-gold cursor-pointer transition-all"
                        >
                          <Upload size={20} />
                          Selecionar .txt, .pdf, .docx
                        </label>
                      ) : (
                        <div className="flex-1 flex items-center justify-between p-3 border-2 border-brand-green bg-brand-green/5 rounded-lg text-brand-green font-medium">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={20} className="shrink-0" />
                            <span className="truncate">{roteiroFile.name}</span>
                          </div>
                          <button type="button" onClick={clearRoteiroFile} className="text-gray-400 hover:text-red-500">
                            <X size={20} />
                          </button>
                        </div>
                      )}

                      {roteiroFile && (
                        <button 
                          type="button" 
                          onClick={extrairDoArquivo}
                          disabled={isExtracting}
                          className="px-4 py-2 bg-brand-gold text-white rounded-lg hover:bg-brand-gold-dark transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {isExtracting ? <Loader2 className="animate-spin" size={18}/> : <Zap size={18}/>}
                          Extrair
                        </button>
                      )}
                    </div>
                  </div>
                </div>
             )}
             {tipoInput === 'carrossel' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition relative">
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" required/>
                  <div className="space-y-2">
                    <ImageIcon size={48} className="mx-auto text-gray-300" />
                    <p className="text-gray-500">Clique ou arraste as imagens aqui</p>
                  </div>
                  {images.length > 0 && <p className="mt-3 text-sm text-brand-green font-bold">{images.length} imagem(ns) carregada(s)</p>}
                </div>
             )}
          </div>
        </section>

        {/* Pass 2: Configuração Individual ou Global */}
        <section className="space-y-6 border-t border-gray-100 pt-8">
          <h2 className="text-xl font-bold text-brand-green flex items-center gap-2">
             <span>2.</span> Tipo de Conteúdo e Nicho
          </h2>
          {listaRoteiros.length > 1 && (
            <div className="p-3 bg-brand-gold/10 border-l-4 border-brand-gold rounded-r-lg text-sm text-brand-brown animate-fade-in mb-4">
              ✨ <strong>{listaRoteiros.length} roteiros detectados!</strong> Configure a estratégia individual de cada um abaixo.
            </div>
          )}
          
          {listaRoteiros.length > 1 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {listaRoteiros.map((roteiro, idx) => (
                   <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand-brown uppercase text-xs tracking-widest">{roteiro.nome}</span>
                        <span className="text-[10px] text-gray-400 italic truncate ml-2 max-w-[150px]">
                          "{roteiro.texto.substring(0, 30)}..."
                        </span>
                      </div>
                      <select 
                        className="input-field !py-2 !text-sm" 
                        value={roteiro.tipoConteudo}
                        onChange={(e) => updateRoteiroType(idx, e.target.value)}
                        required
                      >
                        <option value="" disabled>Escolha a estratégia...</option>
                        {TIPOS_NARRATIVOS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                   </div>
                ))}
             </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qual tipo narrativo você escolheu?</label>
              <select 
                className="input-field" 
                value={tipoConteudoGlobal}
                onChange={(e) => setTipoConteudoGlobal(e.target.value)}
                required
              >
                <option value="" disabled>Selecione um...</option>
                {TIPOS_NARRATIVOS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nicho</label>
            <input 
              type="text" 
              placeholder="Ex: Odontologia" 
              className="input-field"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              required
            />
          </div>
        </section>

        {errorStatus && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{errorStatus}</p>}

        <div className="pt-6 border-t border-gray-100 flex justify-end">
           <button 
              type="submit" 
              className="btn-primary w-full md:w-auto min-w-[200px]"
              disabled={isLoading || isExtracting}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Analisando com GPT-4o...
                </>
              ) : 'Analisar Roteiro(s)'}
           </button>
        </div>
      </form>
    </div>
  )
}
