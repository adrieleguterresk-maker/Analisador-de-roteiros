import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import api from '../api';
import { CheckCircle, Wrench, Sparkles, Copy, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';

export default function ResultAnalysis() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!data);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!data) {
      setLoading(true);
      api.get(`/historico/${id}`)
        .then(res => {
          if (!res.data || !res.data.resultado_json) {
            throw new Error('Formato de dados inválido recebido do servidor.');
          }
          
          setData({
            id: res.data.id,
            transcricao: res.data.transcricao,
            nota: res.data.nota,
            resultado: JSON.parse(res.data.resultado_json)
          });
          setLoading(false);
        })
        .catch(err => {
          console.error('Erro ao buscar histórico:', err);
          setFetchError(err.response?.data?.error || 'Não foi possível carregar os detalhes desta análise.');
          setLoading(false);
        });
    }
  }, [id, data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="animate-spin text-brand-gold" size={48} />
        <p className="font-display text-xl text-brand-brown">Carregando sua análise estratégica...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 card-premium border-red-100 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-red-500" />
        <h2 className="text-2xl font-display font-bold text-gray-900">Ops! Algo deu errado.</h2>
        <p className="text-gray-600">{fetchError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data || !data.resultado) {
    return (
      <div className="p-10 text-center text-red-600 card-premium">
        <AlertCircle size={24} className="mx-auto mb-2" />
        Erro Crítico: Os dados da análise estão incompletos ou corrompidos.
      </div>
    );
  }

  const resultado = data.resultado;
  const analises = resultado.analises || [];
  const analisePrincipal = analises[0] || {}; 
  const resumoExecutivo = resultado.resumo_executivo;

  const getNotaColor = (n) => {
    if (!n && n !== 0) return 'text-gray-400';
    if (n >= 8) return 'text-green-600';
    if (n >= 6) return 'text-yellow-500';
    return 'text-red-600';
  };

  const getBadgeColor = (tipo) => {
    if (!tipo) return 'bg-gray-200 text-gray-800';
    const t = tipo.toLowerCase();
    if (t.includes('nutella')) return 'bg-brand-brown-light text-white';
    if (t.includes('raiz')) return 'bg-brand-brown-dark text-white';
    if (t.includes('educativo 1')) return 'bg-brand-green-light text-white';
    if (t.includes('educativo 2')) return 'bg-brand-green-dark text-white';
    if (t.includes('venda')) return 'bg-brand-gold text-white';
    return 'bg-gray-200 text-gray-800';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Sugestão copiada!');
  };

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between card-premium gap-6">
        <div>
           <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${getBadgeColor(analisePrincipal.tipo_conteudo)}`}>
              {analisePrincipal.tipo_conteudo || 'Tipo Desconhecido'}
           </span>
           <h1 className="text-3xl font-display font-bold text-gray-900 mb-1">
             {analisePrincipal.nicho || 'Análise de Roteiro'}
           </h1>
           <p className="text-gray-500 text-sm">Pronto para conversão</p>
        </div>
        <div className="flex flex-col items-center">
            <div className={`text-6xl font-display font-black ${getNotaColor(data.nota)}`}>
              {data.nota?.toFixed(1) || '0.0'}
              <span className="text-2xl text-gray-400 font-medium">/10</span>
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mt-2">Nota Geral</p>
        </div>
      </header>

      {/* Tabela de Resumo Executivo (Se houver múltiplos roteiros) */}
      {resumoExecutivo && resumoExecutivo.roteiros && (
        <section className="card-premium space-y-4 border-l-4 border-brand-gold">
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2 text-brand-brown">
             <Sparkles className="text-brand-gold"/> 
             Resumo da Semana ({resumoExecutivo.total_roteiros || resumoExecutivo.roteiros.length} Roteiros)
          </h2>
          <p className="text-gray-700">{resumoExecutivo.prioridade_ajuste}</p>
          
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roteiro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Problema</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resumoExecutivo.roteiros.sort((a,b) => (a.nota || 0) - (b.nota || 0)).map((rot, idx) => (
                  <tr key={idx}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rot.nome}</td>
                     <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getNotaColor(rot.nota)}`}>
                       {rot.nota?.toFixed(1) || '0.0'}
                     </td>
                     <td className="px-6 py-4 text-sm text-gray-500">{rot.principal_problema}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Renderizando as Análises */}
      {analises.map((analise, idx) => (
        <div key={idx} className="space-y-8 bg-white/50 p-6 rounded-2xl border border-brand-gold/20">
            {analises.length > 1 && (
               <h3 className="text-2xl font-display font-bold text-brand-green border-b pb-2">
                 {analise.nome_roteiro || `Roteiro ${idx + 1}`} 
                 <span className="text-gray-400 font-medium text-lg ml-2">({analise.nota?.toFixed(1) || '0.0'}/10)</span>
               </h3>
            )}

            {/* Impressao Geral */}
            <section className="bg-white border-l-4 border-brand-green p-6 rounded-r-xl shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Avisos da Especialista</h3>
              <p className="text-gray-700 leading-relaxed">{analise.impressao_geral || 'Nenhuma impressão gerada.'}</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                 <p className="text-sm text-gray-600 italic"><strong>Por que essa nota?</strong> {analise.justificativa_nota}</p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pontos Fortes */}
              <section className="space-y-4">
                 <h2 className="text-xl font-bold flex items-center gap-2 text-green-700">
                    <CheckCircle /> O que está forte ✅
                 </h2>
                 <div className="space-y-3">
                   {analise.pontos_fortes?.map((pf, i) => (
                      <div key={i} className="bg-green-50/50 border border-green-100 p-4 rounded-xl">
                         <h4 className="font-bold text-gray-900 mb-1">{pf.ponto}</h4>
                         <p className="text-sm text-gray-700">{pf.motivo}</p>
                      </div>
                   ))}
                   {(!analise.pontos_fortes || analise.pontos_fortes.length === 0) && <p className="text-gray-400 italic">Não foram detectados pontos fortes específicos.</p>}
                 </div>
              </section>

              {/* O que ajustar */}
              <section className="space-y-4">
                 <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-700">
                    <Wrench /> O que ajustar 🔧
                 </h2>
                 <div className="space-y-4">
                   {analise.pontos_ajuste?.map((pa, i) => (
                      <div key={i} className="card-premium p-5 space-y-3 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold"></div>
                         <span className="text-xs font-bold uppercase tracking-widest text-brand-brown">{pa.elemento}</span>
                         <div className="bg-gray-100 p-3 rounded text-sm text-gray-500 italic line-through decoration-red-300">
                            {pa.versao_atual}
                         </div>
                         <div className="bg-brand-green/10 p-3 rounded border border-brand-green/20 text-sm font-medium text-brand-green-dark">
                            → {pa.versao_recomendada}
                         </div>
                         <p className="text-xs text-gray-500 mt-2 flex gap-1 items-start">
                            <AlertCircle size={14} className="mt-0.5 text-brand-gold shrink-0"/> {pa.motivo}
                         </p>
                      </div>
                   ))}
                   {(!analise.pontos_ajuste || analise.pontos_ajuste.length === 0) && <p className="text-gray-400 italic">Nenhum ajuste sugerido no momento.</p>}
                 </div>
              </section>
            </div>

            {/* Sugestões Expansíveis */}
            <section className="card-premium space-y-2 !p-4">
              <h2 className="text-lg font-bold text-brand-brown px-2 mb-4">Repertório de Sugestões</h2>
              
              <CollapsibleSection title="Ganchos Magnéticos (0-5s)" items={analise.sugestoes?.gancho || []} />
              <CollapsibleSection title="Ideias de Desenvolvimento" items={analise.sugestoes?.desenvolvimento || []} />
              <CollapsibleSection title="CTAs de Conversão" items={analise.sugestoes?.cta || []} />
            </section>
        </div>
      ))}
      
      {/* Se houver transcrição extraída de URL, mostra aqui */}
      {data.transcricao && (
        <section className="mt-8 text-center text-sm">
           <details className="cursor-pointer text-gray-500 hover:text-gray-700 transition">
              <summary className="font-semibold underline decoration-dotted mb-4">Ver transcrição completa gerada do Reel</summary>
              <div className="bg-gray-100 p-4 rounded text-left mt-2 italic mx-auto max-w-3xl">
                 {data.transcricao}
              </div>
           </details>
        </section>
      )}

    </div>
  )
}

function CollapsibleSection({ title, items }) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex justify-between items-center transition"
      >
         <span className="font-semibold text-gray-800">{title}</span>
         {open ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
      </button>
      {open && (
         <div className="p-4 bg-white divide-y divide-gray-100">
            {items.map((item, i) => (
              <div key={i} className="py-4 first:pt-2">
                 {typeof item === 'object' ? (
                   <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Versão Atual:</span>
                         <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg text-sm text-gray-600 italic line-through">
                            {item.atual}
                         </div>
                      </div>
                      <div className="flex flex-col gap-1 relative group">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">Sugestão Julia Ottoni:</span>
                         <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm font-medium text-gray-800 pr-10 whitespace-pre-wrap">
                            {item.sugerido}
                          </div>
                         <button 
                           onClick={() => {
                             navigator.clipboard.writeText(item.sugerido);
                             alert('Copiado para a área de transferência!');
                           }}
                           className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-brand-green hover:bg-brand-green/10 rounded transition opacity-0 group-hover:opacity-100 bg-white shadow-sm"
                           title="Copiar sugestão"
                         >
                            <Copy size={16} />
                         </button>
                      </div>
                   </div>
                 ) : (
                   <div className="flex items-start gap-4 group">
                      <p className="flex-1 text-sm text-gray-700 whitespace-pre-wrap">{item}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item);
                          alert('Copiado para a área de transferência!');
                        }}
                        className="p-2 text-gray-400 hover:text-brand-green hover:bg-brand-green/10 rounded transition opacity-0 group-hover:opacity-100 shrink-0"
                        title="Copiar texto"
                      >
                         <Copy size={16} />
                      </button>
                   </div>
                 )}
              </div>
            ))}
         </div>
      )}
    </div>
  );
}
