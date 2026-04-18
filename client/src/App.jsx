import React, { useState } from 'react';
import storyData from './data/story.json';
import './App.css';
import paxSuccessImg from './assets/pax_happy.png';
import paxErrorImg from './assets/pax_angry.png';
import paxEndImg from './assets/pax_end.png';
import Typewriter from './Typewriter';

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
  const [isGameOver, setIsGameOver] = useState(false); //set end
  const [canShowHint, setCanShowHint] = useState(false); // unlock button after 1 mistake
  const [isHintExpanded, setIsHintExpanded] = useState(false); //expand hint text

  const [databaseSchema, setDatabaseSchema] = useState([]); // Schéma z backendu
  const [rightView, setRightView] = useState('data'); // Přepínač 'data' vs 'schema'

  const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://bakalarska-prace-l067.onrender.com';

  //handle validation based on backend response
  const handleValidate = async (validateMode = true) => {
    if (!query || !query.trim()) { //for empty queries
        setFeedback('Zadejte prosím SQL dotaz vyhledáváním.');
        if (validateMode) {
            setValidationResult('ŠPATNĚ');
        }
        return;
    }
    setLoading(true);
    setRightView('data'); // while query is sent, result table should automatically be displayed
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
      const response = await fetch(`${API_BASE_URL}/api/validate`, {
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
    const response = await fetch(`${API_BASE_URL}/api/schema`);
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
  } else if (currentPart === 'part_3') {
    setIsGameOver(true);
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
    ) : isGameOver ? ( //end screen
      <div className="intro-screen">
        <h1 style={{ color: '#1d8f1d' }}>
          PŘÍPAD UZAVŘEN
        </h1>
        
        <img src={paxEndImg} alt="Pax End" className="pax-image-large" />

        <div className="pax-terminal end-game-pax">
          <strong>[ INSPEKTOR PAX ]</strong>
          <Typewriter text={storyData.game_end.pax_final}speed={20} />
        </div>

        <p style={{ fontSize: '0.9rem', opacity: 0.8, color: '#1a1212' }}>
        {storyData.game_end.thanks}
        </p>
        
        <button onClick={() => window.location.reload()} className="btn btn-secondary">
          HRÁT ZNOVU
        </button>
      </div>

    ) :
    ( //defines layout
      <div className="main-layout">
        <div className="left-column">
          <h1>{storyData[currentLevel].title}</h1>
          <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>
            Vítejte v operačním centru. Vaším úkolem je analyzovat dostupné záznamy a najít shodu s popisem od svědků. Pamatujte na technická specifika našeho archivu: názvy sloupců jsou vždy bez diakritiky. Nicméně v samotných datech se diakritika běžně vyskytuje a vyhledávání je citlivé na velikost písmen. Hodně štěstí!
          </p>

          <div className="pax-terminal">
             <div className="pax-column">
              <strong>[ INSPEKTOR PAX ]</strong>
                <Typewriter text={storyData[currentLevel][currentPart].pax_intro} speed={20} />
            </div>
            </div>

          <p>Zadejte SQL dotaz:</p>
          <textarea 
            className="sql-editor"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            placeholder="SELECT * FROM..."
          />
          {/* buttons for results and validation */}
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}> 
            <button onClick={() => handleValidate(false)} disabled={loading} className="btn btn-secondary" style={{ marginRight: '10px' }}>
              Zobrazit výsledek 
            </button>
            <button onClick={() => handleValidate(true)} disabled={loading} className="btn btn-primary">
              {loading ? 'Pax prověřuje shodu...' : 'Předložit stopu'}
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
                  Nápověda se zpřístupní po první nesprávné neprázdné předložené stopě.
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
              <img 
                src={validationResult === 'SPRÁVNĚ' ? paxSuccessImg : paxErrorImg} 
                alt="Pax Status" 
                className="pax-avatar" 
              />
              <div className="pax-column">
                <strong style={{ color: '#d1c7bc' }}>[ INSPEKTOR PAX ]</strong>
                <p style={{ 
                  color: validationResult === 'SPRÁVNĚ' ? '#00ff00' : '#d32f2f',
                  fontWeight: 'bold'
                }}>
                  {validationResult}
                </p>
                <p style={{lineHeight: '1.4' }}>
                  <Typewriter 
                    text={validationResult === 'SPRÁVNĚ' 
                      ? storyData[currentLevel][currentPart].pax_success 
                      : storyData[currentLevel][currentPart].pax_error} 
                    speed={20} 
                  />
                </p>
                {validationResult === 'SPRÁVNĚ' && (
                  <button  //button for continuing
                    className="btn btn-primary" 
                    style={{ marginTop: '15px', alignSelf: 'flex-start' }}
                    onClick={goToNextPart} //function for next part
                  >
                    {currentPart === 'part_3' ? 'UZAVŘÍT PŘÍPAD' : 'Pokračovat v pátrání'}
                  </button>
                )}
              </div>
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
                          col !== 'osoba_id' && (
                          <th key={index} style={{ textAlign: 'left', padding: '12px' }}>{col}</th>
                        )))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            columns[cellIndex] !== 'osoba_id' && (
                            <td key={cellIndex} style={{ padding: '12px', borderBottom: '1px solid #d1c7bc', textAlign: 'left' }}>
                              {cell}
                            </td>
                          )))}
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
                          {table.columns
                          .filter(col => col.name !== 'osoba_id') //foreign key is not visible as it is not needed
                          .map(col => (
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