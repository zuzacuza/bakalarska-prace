const express = require('express');
const cors = require('cors');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// load database to server while starting
let db;
const loadDB = async () => {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, 'data', 'level_one.sqlite');
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
    console.log("Database for level one is ready.");
};
loadDB();

// master solutions - for validation
const MASTER_QUERIES = {
    level_1: {
        part_1: [
            "SELECT * FROM svedci WHERE prijmeni = 'Moretti'",
            "SELECT vypoved FROM svedci WHERE prijmeni = 'Moretti'"
        ],
        part_2: ["SELECT * FROM obyvatele WHERE vyska > 190 AND barva_vlasu = 'šedivá'"],
        part_3: ["SELECT * FROM obyvatele WHERE vyska > 190 AND barva_vlasu = 'šedivá' AND znacka_auta = 'Audi' AND barva_auta = 'stříbrná'"]
    }
};

app.post('/api/validate', (req, res) => {
    const { query: studentSQL, level, part } = req.body; //query written by user + part and level

    try {
        const studentRes = db.exec(studentSQL);

        if (!studentRes || studentRes.length === 0) {
            return res.json({ 
                isCorrect: false
            });
        }

        const solutions = MASTER_QUERIES[level][part];
        
       //logic for validation
        let isCorrect = false;
        for (const masterSQL of solutions) {
            const masterRes = db.exec(masterSQL);
            if (JSON.stringify(masterRes) === JSON.stringify(studentRes)) {
                isCorrect = true;
                break;
            }
        }

        res.json({
            isCorrect: isCorrect,
            data: studentRes[0].values, // send data to frontend
            columns: studentRes[0].columns,
            message: isCorrect ? "SPRÁVNĚ" : "ŠPATNĚ"
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

//loads database schema
app.get('/api/schema', (req, res) => {
    try {
        // all tables except system made tables
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
        
        if (tables.length === 0) {
            return res.json([]);
        }

        // take columns from tables
        const schema = tables[0].values.map(row => {
            const tableName = row[0];
            const columnsInfo = db.exec(`PRAGMA table_info(${tableName});`);
            
            return {
                name: tableName,
                columns: columnsInfo[0].values.map(col => ({
                    name: col[1], // column name
                    type: col[2]  // data type
                }))
            };
        });

        res.json(schema);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});