const express = require('express');
const app = express();
const port = 8000;
app.use(express.json());
app.use(express.static(__dirname)); // serve static files from base directory

app.get('/', (req, res) => {
  console.log("hhmm");
  res.sendFile(path.join(__dirname, 'index.html'));
});



app.post('/log', (req, res) => {
  console.log(req.body.message);
  res.send('Log message received');
});



app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});