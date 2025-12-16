const express = require('express');
const path = require('path');
const app = express();
const port = 6969;

// Serve static folders
app.use('/Pages', express.static(path.join(__dirname, 'Pages')));
app.use('/Foundry', express.static(path.join(__dirname, 'Foundry')));
app.use('/Sources', express.static(path.join(__dirname, 'Sources')));

// Default route → index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index.html'));
});

app.listen(port, () => {
  console.log(`MonsterFactory running at http://localhost:${port}`);
});