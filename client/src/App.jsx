import React, { useState, useEffect } from 'react'

function App() {
    const [msg, setMsg] = useState('čekám na singál')

    useEffect(() => {
        fetch('http://localhost:5000/api/ping')
        .then(res => res.json())
        .then(data => setMsg(data.message))
        .catch(err => setMsg('server error'))
    }, [])

    return (
        <div style={{padding: '40px', textAlign: 'center'}}>
            <h1>BP test</h1>
            <p style={{ fontSize: '1.5rem', color: 'green'}}>{msg}</p>
        </div>
    )
}

export default App