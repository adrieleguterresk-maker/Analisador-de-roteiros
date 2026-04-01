const { getDbConnection } = require('../database/database');

async function listarHistorico(req, res) {
  try {
    const db = await getDbConnection();
    const rows = await db.all(`
      SELECT id, tipo_input, tipo_conteudo, nicho, subnicho, nota, data_criacao 
      FROM analises 
      ORDER BY data_criacao DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }
}

async function detalheAnalise(req, res) {
  try {
    const id = req.params.id;
    const db = await getDbConnection();
    const analise = await db.get(`SELECT * FROM analises WHERE id = ?`, [id]);
    
    if (!analise) {
      return res.status(404).json({ error: 'Análise não encontrada.' });
    }

    res.json(analise);
  } catch (error) {
    console.error('Erro ao buscar detalhe da análise:', error);
    res.status(500).json({ error: 'Erro ao buscar análise.' });
  }
}

async function excluirAnalise(req, res) {
  try {
    const id = req.params.id;
    const db = await getDbConnection();
    await db.run(`DELETE FROM roteiros_multiplos WHERE analise_id = ?`, [id]);
    await db.run(`DELETE FROM analises WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir análise:', error);
    res.status(500).json({ error: 'Erro ao excluir análise.' });
  }
}

module.exports = {
  listarHistorico,
  detalheAnalise,
  excluirAnalise
};
