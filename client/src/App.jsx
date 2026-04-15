import React, { useState } from 'react';
import storyData from './data/story.json';
import './App.css';

function App() {
  const [query, setQuery] = useState(''); // save users query
  const [feedback, setFeedback] = useState(''); // server response on rows count
  const [validationResult, setValidationResult] = useState(null); //validation
  const [loading, setLoading] = useState(false); //track loading status
  const [results, setResults] = useState([]); //for values in rows
  const [columns, setColumns] = useState([]); //for column names
  const [isIntroVisible, setIsIntroVisible] = useState(true); //game intro will be displayed
  const [history, setHistory] = useState([]); //history of users queries

  const [currentLevel, setCurrentLevel] = useState('level_1'); //setting story parts
  const [currentPart, setCurrentPart] = useState('part_1');
  const [canShowHint, setCanShowHint] = useState(false); // unlock button after 1 mistake
  const [isHintExpanded, setIsHintExpanded] = useState(false); //expand hint text

  const [databaseSchema, setDatabaseSchema] = useState([]); // Schéma z backendu
  const [rightView, setRightView] = useState('data'); // Přepínač 'data' vs 'schema'

  //hadnle validation based on backend response
  const handleValidate = async (validateMode = true) => {
    setLoading(true);
    setFeedback('Odesláno k validaci.');
    if (validateMode) setValidationResult(null);

    //hadles all historical queries
    const newHistoryEntry = {
    queryText: query,
    type: validateMode ? 'VALIDACE ' : 'NÁHLED ',
    time: new Date().toLocaleTimeString()
  };
  setHistory(prev => [newHistoryEntry, ...prev]);

    //fetch master query
    try {
      const response = await fetch('http://localhost:5000/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
        query: query, 
        level: currentLevel, 
        part: currentPart 
      }),
    });


      const data = await response.json();

      //displays data, count number of rows
      if (response.ok) {
        setResults(data.data || []);
        setColumns(data.columns || []);
        setFeedback(`Analýza dokončena. Nalezeno záznamů: ${data.data?.length || 0}`);

        //validation and hint logic
        if (validateMode) {
          setValidationResult(data.message);;
          if (data.isCorrect) {
            setCanShowHint(false);
            setIsHintExpanded(false);
          } else {
            setCanShowHint(true);
          }
        }
      } else { 
        setFeedback("Chyba v SQL dotazu: " + data.error);
        setResults([]);
      }
    } catch (err) {
      setFeedback('Chyba: Nepodařilo se spojit se serverem.');
    } finally {
      setLoading(false);
    }
  };

  //fetch database scheme from server
  const fetchSchema = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/schema');
    const data = await response.json();
    setDatabaseSchema(data);
  } catch (err) {
    console.error("Schéma se nepodařilo načíst.");
  }
};

// load schema at start
  React.useEffect(() => {
    fetchSchema();
  }, []);

  //for story continuation
  const goToNextPart = () => {
  if (currentPart === 'part_1') {
    setCurrentPart('part_2');
  } else if (currentPart === 'part_2') {
    setCurrentPart('part_3');
  }
  //reset states
  setQuery('');
  setValidationResult(null);
  setResults([]);
  setFeedback('');
  setCanShowHint(false);
  setIsHintExpanded(false);
};


return (
  <div className="app-container">
    {isIntroVisible ? ( //display intro screen on load
      <div className="intro-screen">
        <h1>SELECT: ZLOČIN</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', fontStyle: 'italic', color: '#1a1212' }}>
          {storyData.game_intro}
        </p>
        <button onClick={() => setIsIntroVisible(false)} className="btn btn-primary">
          VSTOUPIT DO KANCELÁŘE
        </button>
      </div>
    ) : ( //defines layout
      <div className="main-layout">
        <div className="left-column">
          <h1>{storyData[currentLevel].title}</h1>
          <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>
            Vítej v kanceláři. Prozkoumej databázi a najdi shodu s popisem. DOPSAT TEXT
          </p>

          <div className="pax-terminal"> 
            <strong>[ INSPEKTOR PAX ]</strong>
            <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>
              {validationResult === 'SPRÁVNĚ' 
                ? storyData[currentLevel][currentPart].pax_success 
                : storyData[currentLevel][currentPart].pax_intro}
            </p>
          </div>

          <p>Zadejte SQL dotaz:</p>
          <textarea 
            className="sql-editor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zadej SQL dotaz..."
          />
          {/* buttons for results and validation */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}> 
            <button onClick={() => handleValidate(false)} disabled={loading} className="btn btn-secondary" style={{ marginRight: '10px' }}>
              Zobrazit výsledek 
            </button>
            <button onClick={() => handleValidate(true)} disabled={loading} className="btn btn-primary">
              {loading ? 'Validace probíhá' : 'Validovat dotaz'}
            </button>

            {/* hint */}
            <div className="tooltip-container">
              <button 
                className="btn btn-secondary" 
                style={{ marginLeft: '10px' }} 
                disabled={!canShowHint}
                onClick={() => setIsHintExpanded(!isHintExpanded)}
              >
                {isHintExpanded ? "Skrýt nápovědu" : "Nápověda"}
              </button>
              {!canShowHint && (
                <span className="tooltip-text">
                  Nápověda bude k dispozici po prvním špatném pokusu o validaci.
                </span>
              )}
            </div>
          </div>

          {isHintExpanded && (
            <div className="hint-text" style={{ color: '#c28e44', marginTop: '10px' }}>
              <strong>NÁPOVĚDA:</strong> {storyData[currentLevel][currentPart].hint}
            </div>
          )}

          {validationResult && ( //validation 
            <div className="validation-card">
              <strong style={{ color: '#c28e44' }}>[ INSPEKTOR PAX ]</strong>
              <p style={{ 
                color: validationResult === 'SPRÁVNĚ' ? '#00ff00' : '#d32f2f',
                fontWeight: 'bold', marginTop: '10px', fontSize: '1.1rem'
              }}>
                {validationResult}
              </p>
              {validationResult === 'SPRÁVNĚ' && ( //button for continuing
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '15px' }}
                  onClick={goToNextPart} // call function for story continuation
                >
                  {currentPart === 'part_3' ? 'UZAVŘÍT PŘÍPAD' : 'Pokračovat v pátrání'}
                </button>
              )}
            </div>
          )}

          {feedback && ( //number of rows
            <div className="feedback-box">
              <strong style={{ fontSize: '0.8rem' }}>[ ANALÝZA SYSTÉMU ]</strong>
              <p style={{ marginTop: '5px' }}>{feedback}</p>
            </div>
          )}
        </div>

        {/* right column - schema, result table and history */}
        <div className="right-column">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button 
              className={`btn ${rightView === 'data' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 15px', fontSize: '0.8rem' }}
              onClick={() => setRightView('data')}
            >
              Výpis dat
            </button>
            <button 
              className={`btn ${rightView === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 15px', fontSize: '0.8rem' }}
              onClick={() => setRightView('schema')}
            >
              Schéma databáze
            </button>
            <button 
              className={`btn ${rightView === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 15px', fontSize: '0.8rem' }}
              onClick={() => setRightView('history')}
            >
              Historie dotazů
            </button>
          </div>

         {rightView === 'data' && ( //result data
            <>
              <h2 style={{ marginBottom: '20px' }}>Výpis z databáze</h2>
              {results.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="result-table">
                    <thead>
                      <tr>
                        {columns.map((col, index) => (
                          <th key={index} style={{ textAlign: 'left', padding: '12px' }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} style={{ padding: '12px', borderBottom: '1px solid #d1c7bc', textAlign: 'left' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '50px', border: '2px dashed #3d2b2b', borderRadius: '12px', textAlign: 'center', opacity: 0.5 }}>
                  Pro zobrazení dat zadejte první dotaz.
                </div>
              )}
            </>
          )}

          {rightView === 'schema' && ( //schema
            <>
              <h2 style={{ marginBottom: '20px' }}>V archivu najdete tyto tabulky.</h2>
              <div className="schema-container">
                {databaseSchema.map((table) => (
                  <div key={table.name} className="schema-table-card">
                    <div className="schema-table-header">
                      <strong>TABULKA: {table.name}</strong>
                    </div>
                    <div className="schema-table-body">
                      <table className="inner-schema-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #5c1a1a' }}>
                            <th style={{ textAlign: 'left', padding: '5px' }}>Sloupec</th>
                            <th style={{ textAlign: 'left', padding: '5px' }}>Typ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map(col => (
                            <tr key={col.name}>
                              <td style={{ padding: '5px' }}><strong>{col.name}</strong></td>
                              <td style={{ padding: '5px', color: '#5c1a1a' }}>{col.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {rightView === 'history' && ( //history
            <>
              <h2 style={{ marginBottom: '20px' }}>Historie vyšetřování</h2>
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map((entry, index) => (
                    <div key={index} className="history-item">
                      <div className="history-header">
                        <span className="history-type">{entry.type}</span>
                        <span className="history-time">{entry.time}</span>
                      </div>
                      <code className="history-query">{entry.queryText}</code>
                      <button 
                        className="btn-link" 
                        onClick={() => setQuery(entry.queryText)}
                      >
                        Hledat znovu
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '50px', border: '2px dashed #3d2b2b', borderRadius: '12px', textAlign: 'center', opacity: 0.5 }}>
                  Pro zobrazení historie zadejte dotaz.
                </div>
              )}
            </>
          )}
        </div> 
      </div>   
    )}       
  </div>     
);         
}            

export default App;