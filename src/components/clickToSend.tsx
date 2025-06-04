// App.js
import React, { useState } from 'react';
import axios from 'axios';

function ClickSend() {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);

  const sendSMS = async () => {
    try {
      const res = await axios.post('http://localhost:5000/send-sms', { to, message });
      setResponse(res.data);
    } catch (err) {
    //   setResponse({ success: false, error: err.message });
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Send SMS with ClickSend</h2>
      <input
        type="text"
        placeholder="Phone Number (e.g. +14155552671)"
        value={to}
        onChange={e => setTo(e.target.value)}
        style={{ width: '300px', marginBottom: '1rem', display: 'block' }}
      />
      <textarea
        placeholder="Your message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        style={{ width: '300px', height: '100px', marginBottom: '1rem', display: 'block' }}
      />
      <button onClick={sendSMS}>Send SMS</button>
      {response && (
        <pre style={{ marginTop: '1rem' }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default ClickSend;
