const { supabase } = require('../database/supabase');

async function listarHistorico(req, res) {
  try {
    const { data, error } = await supabase
      .from('analises')
      .select('id, tipo_input, tipo_conteudo, nicho, subnicho, nota, data_criacao')
      .order('data_criacao', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico no Supabase.' });
  }
}

async function detalheAnalise(req, res) {
  try {
    const id = req.params.id;
    const { data, error } = await supabase
      .from('analises')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Análise não encontrada.' });
    }

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar detalhe da análise:', error);
    res.status(500).json({ error: 'Erro ao buscar análise no Supabase.' });
  }
}

async function excluirAnalise(req, res) {
  try {
    const id = req.params.id;
    
    // O delete em cascata deve estar configurado no banco, 
    // mas por segurança podemos deletar aqui também se necessário.
    // Com 'ON DELETE CASCADE' na FK, deletar da 'analises' já limpa 'roteiros_multiplos'.
    const { error } = await supabase
      .from('analises')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir análise:', error);
    res.status(500).json({ error: 'Erro ao excluir análise no Supabase.' });
  }
}

module.exports = {
  listarHistorico,
  detalheAnalise,
  excluirAnalise
};

