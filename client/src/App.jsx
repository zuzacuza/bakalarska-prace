import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState(''); // save users query
  const [feedback, setFeedback] = useState(''); // server response
  const [loading, setLoading] = useState(false); //track loading status
  const [results, setResults] = useState([]); //for values in rows
  const [columns, setColumns] = useState([]); //for column names

  //valideteMode determines if the query should be now validated
  const handleValidate = async (validateMode = true) => {
    setLoading(true);
    setFeedback('Odesláno k validaci.');

    //fetch server
    try {
      const response = await fetch('http://localhost:5000/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query }),
      });

      const data = await response.json();

      if (response.ok) {
        // save db response from users query
        setResults(data.data || []);  
        setColumns(data.columns || [])
        console.log('data zobrazena')

        if (validateMode) {
          setFeedback(data.message); 
        } else {
          setFeedback(`Zobrazeno ${data.data?.length || 0} záznamů.`);
        }
      } else { 
        // catch syntax error
        setFeedback("Chyba v SQL dotazu: " + data.error);
        setResults([]); //table is not displayed if syntax error occured
      }
    } catch (err) {
      setFeedback('Chyba: Nepodařilo se spojit se serverem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>SELECT: Zločin Editor</h1>
      
      <p>Zadej SQL dotaz:</p>
      <textarea //field for writing queries
        style={{ width: '100%', height: '150px', fontSize: '16px', padding: '10px', backgroundColor: '#f4f4f4' }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="SELECT * FROM ..."
      />
      
      <br />

      <button //displays result tabule but does not validate
        onClick={() => handleValidate(false)} 
        disabled={loading}
        style={{ marginTop: '10px', marginRight: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '16px' }}
      >
        Zobrazit výsledek
      </button>
      
      <button //button for valitadion
        onClick={handleValidate} 
        disabled={loading}
        style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '16px' }}
      >
        {loading ? 'Validace probíhá' : 'Validovat dotaz'}
      </button>

      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <strong>Vyhodnocení:</strong>
        <p style={{ color: feedback.includes('SPRÁVNĚ') ? 'green' : 'red' }}>{feedback}</p>
      </div>
      {results.length > 0 && ( //table with data based on user input
        <div style={{ marginTop: '30px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #333' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: 'white' }}>
                {columns.map((col, index) => (
                  <th key={index} style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ backgroundColor: rowIndex % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;