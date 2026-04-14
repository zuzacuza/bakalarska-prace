const express = require('express');
const cors = require('cors');
const fs = require('fs');
const initSqlJs = require('sql.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// load database to server while starting
let db;
const loadDB = async () => {
    const SQL = await initSqlJs();
    const filebuffer = fs.readFileSync('./data/level_one.sqlite');
    db = new SQL.Database(filebuffer);
    console.log("Database for level one is ready.");
};
loadDB();

// master solution - for validation
const MASTER_SQL = "SELECT * FROM obyvatele WHERE vyska > 190 AND barva_vlasu = 'šedivá' AND znacka_auta = 'Audi' AND barva_auta = 'stříbrná'";

app.post('/api/validate', (req, res) => {
    const studentSQL = req.body.query; // query written by user

    try {
        const masterRes = db.exec(MASTER_SQL);
        const studentRes = db.exec(studentSQL);

        // if no data is returned
        if (studentRes.length === 0) {
            return res.json({ isCorrect: false, message: "Dotaz nevrátil žádné výsledkx:(", data: [] });
        }

        // compare users query with master
        const isCorrect = JSON.stringify(masterRes) === JSON.stringify(studentRes);

        res.json({
            isCorrect: isCorrect,
            data: studentRes[0].values, // send data to frontend
            columns: studentRes[0].columns,
            message: isCorrect ? "SPRÁVNĚ" : "ŠPATNĚ"
        });

    } catch (err) {
        // display error, if users query returns it
        res.status(400).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});