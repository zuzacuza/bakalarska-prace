const express = require('express');
const cors = require('cors');
const fs = require('fs');
const initSqlJs = require('sql.js');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

//web protection - authorited domains
const allowedOrigins = [
    'http://localhost:5173',          
    'https://bakalarska-prace-delta.vercel.app' 
];

const corsOptions = {
    origin: allowedOrigins,
    optionsSuccessStatus: 200
};  

app.use(cors(corsOptions));
app.use(express.json());

// load database to server while starting
let SQL;
let dbBuffer;

const setupDB = async () => {
    SQL = await initSqlJs();
    const dbPath = path.join(__dirname, 'data', 'level_one.sqlite');
    dbBuffer = fs.readFileSync(dbPath);
    console.log("Database template is ready in memory.");
};
setupDB();

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

const executeWithTimeout = (db, query, timeoutMs = 1000) => {
    return Promise.race([
        new Promise((resolve, reject) => {
            try {
                const result = db.exec(query);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Dotaz překročil časový limit 1000 ms.")), timeoutMs)
        )
    ]);
};

app.post('/api/validate', async (req, res) => {
    const { query: studentSQL, level, part } = req.body; //query written by user + part and level
    let tempDb;

    try {
        // blocking destructive queires
        const forbiddenKeywords = [/DROP/i, /CREATE/i, /ALTER/i, /DELETE/i, /UPDATE/i, /INSERT/i];
        if (forbiddenKeywords.some(regex => regex.test(studentSQL))) {
            return res.status(400).json({ error: "Dotaz obsahuje nepovolené operace (DROP, DELETE, UPDATE atd.)." });
        }

        // izolation and integrity protection
        tempDb = new SQL.Database(dbBuffer);
        const studentRes = await executeWithTimeout(tempDb, studentSQL, 1000);

        if (!studentRes || studentRes.length === 0) {
            return res.json({ 
                isCorrect: false
            });
        }

        const solutions = MASTER_QUERIES[level][part];
        
       //logic for validation
        let isCorrect = false;
        for (const masterSQL of solutions) {
            const masterRes = tempDb.exec(masterSQL);
            if (JSON.stringify(masterRes) === JSON.stringify(studentRes)) {
                isCorrect = true;
                break;
            }
        }

        //limit results to max 100 records
        const limitedValues = studentRes[0].values.slice(0, 100);
        tempDb.close()

        res.json({
            isCorrect: isCorrect,
            data: studentRes[0].values, // send data to frontend
            columns: studentRes[0].columns,
            message: isCorrect ? "SPRÁVNĚ" : (limitedValues.length >= 100 ? "Zobrazeno prvních 100 záznamů." : "ŠPATNĚ")
        });

    } catch (err) {
       if (tempDb) {
            try { tempDb.close(); } catch (e) { /* ignore */ }
        }
        
        if (!res.headersSent) {
            return res.status(400).json({ error: err.message });
        }
        console.error("Chyba po odeslání hlaviček:", err.message);
    }
});

//loads database schema
app.get('/api/schema', (req, res) => {
    try {
        // all tables except system made tables
        const tempDb = new SQL.Database(dbBuffer);
        const tables = tempDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
        
        if (tables.length === 0) {
            tempDb.close();
            return res.json([]);
        }

        // take columns from tables
        const schema = tables[0].values.map(row => {
            const tableName = row[0];
            const columnsInfo = tempDb.exec(`PRAGMA table_info(${tableName});`);
            
            return {
                name: tableName,
                columns: columnsInfo[0].values.map(col => ({
                    name: col[1], // column name
                    type: col[2]  // data type
                }))
            };
        });

        res.json(schema);
        tempDb.close();

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});