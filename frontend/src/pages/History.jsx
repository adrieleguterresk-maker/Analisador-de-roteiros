import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Search, Trash2, ChevronRight, Calendar, Tag } from 'lucide-react';

export default function History() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busca, setBusca] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const res = await api.get('/historico');
      setHistorico(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const excluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta análise para sempre?')) {
      try {
        await api.delete(`/historico/${id}`);
        setHistorico(historico.filter(h => h.id !== id));
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const filtered = historico.filter(h => {
    const matchTipo = filtroTipo ? h.tipo_conteudo === filtroTipo : true;
    const matchBusca = busca ? h.nicho.toLowerCase().includes(busca.toLowerCase()) : true;
    return matchTipo && matchBusca;
  });

  const getBadgeColor = (tipo) => {
    const t = tipo?.toLowerCase() || '';
    if (t.includes('nutella')) return 'bg-brand-brown-light text-white';
    if (t.includes('raiz')) return 'bg-brand-brown-dark text-white';
    if (t.includes('educativo 1')) return 'bg-brand-green-light text-white';
    if (t.includes('educativo 2')) return 'bg-brand-green-dark text-white';
    if (t.includes('venda')) return 'bg-brand-gold text-white';
    return 'bg-gray-200 text-gray-800';
  };

  const getNotaColor = (n) => {
    if (n >= 8) return 'text-green-600 bg-green-50';
    if (n >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 card-premium mb-8">
         <h1 className="text-3xl font-display font-bold text-gray-900">Histórico de Análises</h1>
         <div className="flex w-full md:w-auto gap-4">
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Buscar nicho..." 
                 className="input-field pl-10"
                 value={busca}
                 onChange={e => setBusca(e.target.value)}
               />
            </div>
            <select className="input-field max-w-[200px]" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
               <option value="">Todos os tipos</option>
               <option value="Conexão Nutella">Conexão Nutella</option>
               <option value="Conexão Raiz">Conexão Raiz</option>
               <option value="Educativo 1">Educativo 1</option>
               <option value="Educativo 2">Educativo 2</option>
               <option value="Venda Direta">Venda Direta</option>
            </select>
         </div>
      </div>

      {loading ? (
         <div className="text-center text-gray-400 font-display">Carregando acervo...</div>
      ) : filtered.length === 0 ? (
         <div className="text-center p-10 bg-gray-50 border border-dashed rounded-xl border-gray-300">
           Nenhuma análise encontrada. Comece gerando a sua primeira!
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="card-premium hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer border-t-4 border-t-brand-green">
               <div>
                 <div className="flex justify-between items-start mb-4">
                   <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(item.tipo_conteudo)}`}>
                     {item.tipo_conteudo}
                   </div>
                   <div className={`px-3 py-1 rounded-xl text-lg font-black font-display ${getNotaColor(item.nota)}`}>
                     {item.nota?.toFixed(1)}
                   </div>
                 </div>
                 
                 <h3 className="text-xl font-display font-bold text-gray-900 group-hover:text-brand-green transition-colors mt-2 mb-1">
                   {item.nicho}
                 </h3>

                 <div className="text-xs text-gray-400 flex items-center gap-1">
                   <Calendar size={12}/> {new Date(item.data_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                 </div>
               </div>
               
               <div className="mt-6 flex gap-2 border-t pt-4">
                 <button 
                   onClick={(e) => { e.stopPropagation(); navigate(`/analise/${item.id}`); }}
                   className="flex-1 bg-brand-green text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-green-dark transition flex items-center justify-center gap-1"
                 >
                   Ver Detalhes <ChevronRight size={16} />
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); excluir(item.id); }}
                   className="p-2 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 hover:border-red-500 transition"
                   title="Excluir"
                 >
                   <Trash2 size={18} />
                 </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
