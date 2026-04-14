import React, { useState } from 'react';

function App() {
  const [query, setQuery] = useState(''); // save users query
  const [feedback, setFeedback] = useState(''); // server response
  const [loading, setLoading] = useState(false); //track loading status

  const handleValidate = async () => {
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
        // validate by isCorrect boolean
        setFeedback(data.message); 
        console.log("Data z DB:", data.data); // write data to console
      } else {
        // catch syntax error
        setFeedback("Chyba v SQL dotazu: " + data.error);
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
    </div>
  );
}

export default App;