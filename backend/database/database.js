const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function getDbConnection() {
  const dbPromise = open({
    filename: path.join(__dirname, '..', 'data', 'database.sqlite'),
    driver: sqlite3.Database
  });

  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS analises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_input TEXT,
      tipo_conteudo TEXT,
      nicho TEXT,
      subnicho TEXT,
      input_original TEXT,
      transcricao TEXT,
      resultado_json TEXT,
      nota REAL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roteiros_multiplos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analise_id INTEGER REFERENCES analises(id),
      nome_roteiro TEXT,
      nota REAL,
      principal_problema TEXT,
      analise_json TEXT
    );
  `);

  return db;
}

module.exports = {
  getDbConnection
};
