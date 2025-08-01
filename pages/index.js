// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('GP');
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!search) {
      setError('Vui lòng nhập từ khóa tìm kiếm');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search, mode }),
      });
      const json = await res.json();
      if (res.ok) {
        setHeader(json.header);
        setData(json.result);
      } else {
        setError(json.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* Input Search */}
      <textarea
        placeholder="Nhập site hoặc mã (có thể nhập nhiều dòng)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        rows={3}
        style={{ width: '400px', padding: '8px', fontSize: '16px' }}
      />
      <br />
      <button onClick={handleSearch} style={{ marginTop: '10px', padding: '10px 20px', background: 'green', color: 'white', fontWeight: 'bold' }}>
        🔍 Tìm kiếm
      </button>

      {/* Tabs */}
      <div style={{ marginTop: '20px' }}>
        {['GP', 'TEXT', 'HOME'].map((tab) => (
          <button
            key={tab}
            onClick={() => setMode(tab)}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              background: mode === tab ? 'black' : '#ccc',
              color: mode === tab ? 'white' : 'black',
              fontWeight: 'bold',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading/Error */}
      {loading && <p>⏳ Đang tìm kiếm...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Table */}
      {data.length > 0 && (
        <table border="1" cellPadding="5" style={{ marginTop: '20px', borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {header.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, cidx) => (
                  <td key={cidx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
