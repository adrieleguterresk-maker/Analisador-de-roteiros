import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import ResultAnalysis from './pages/ResultAnalysis';
import { Sparkles, History as HistoryIcon } from 'lucide-react';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-brand-green shadow-premium z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="text-brand-gold h-6 w-6" />
            <span className="font-display font-bold text-xl text-white tracking-wide">
              Roteiros Magnéticos
            </span>
          </Link>
          <nav className="flex gap-6">
            <Link to="/" className="text-white/90 hover:text-brand-gold font-medium transition-colors">
              Nova Análise
            </Link>
            <Link to="/historico" className="text-white/90 hover:text-brand-gold font-medium transition-colors flex items-center gap-1">
              <HistoryIcon size={18} /> Histórico
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/historico" element={<History />} />
          <Route path="/analise/:id" element={<ResultAnalysis />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
