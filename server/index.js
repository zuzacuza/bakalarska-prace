const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT 

app.use(cors());
app.use(express.json());

//test
app.get('/api/ping', (req, res) => {
  res.json({ message: "whatsup" });
});

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});