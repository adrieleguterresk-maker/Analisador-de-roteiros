const express = require('express');
const app = express();
const PORT = 3001;

app.get('/health', (req, res) => res.send('ok'));

const server = app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

setTimeout(() => {
  console.log('Test server finished');
  server.close();
}, 5000);
