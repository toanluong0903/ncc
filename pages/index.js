import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeSheet, setActiveSheet] = useState('GP'); // Sheet mặc định
  const [expandedNote, setExpandedNote] = useState(null); // 🆕 state cho ghi chú dài

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const response = await fetch(`/api/check?query=${encodeURIComponent(query)}&sheet=${activeSheet}`);
      const data = await response.json();
      if (data.error) {
        setResults([]);
        alert(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tìm kiếm');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* Ô nhập query */}
      <textarea
        rows="4"
        style={{ width: '100%', marginBottom: '10px' }}
        placeholder="Nhập site hoặc mã (mỗi dòng một giá trị)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      ></textarea>

      {/* Nút tìm kiếm */}
      <button
        onClick={handleSearch}
        style={{ background: 'green', color: 'white', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
      >
        🔍 Tìm kiếm
      </button>

      {/* Tab chuyển sheet */}
      <div style={{ marginTop: '10px' }}>
        {['GP', 'TEXT', 'HOME'].map((sheet) => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            style={{
              marginRight: '10px',
              padding: '6px 12px',
              background: activeSheet === sheet ? '#333' : '#ccc',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* Bảng kết quả */}
      {results.length > 0 && (
        <table
          border="1"
          cellPadding="5"
          style={{ borderCollapse: 'collapse', width: '100%', marginTop: '20px', fontSize: '14px' }}
        >
          <thead style={{ background: '#f2f2f2' }}>
            <tr>
              {[
                'CS',
                'Tình Trạng',
                'Bóng',
                'BET',
                'Site',
                'Chủ đề',
                'DR',
                'Traffic',
                'Ghi Chú',
                'Giá Bán',
                'Giá Mua',
                'HH',
                'Giá Cuối',
                'LN',
                'Time',
                'Tên',
                'Mã'
              ].map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, cidx) => {
                  // 🆕 Ẩn ghi chú dài hơn 30 ký tự
                  if (cidx === 8 && cell && cell.length > 30) {
                    return (
                      <td
                        key={cidx}
                        style={{ cursor: 'pointer', color: 'blue' }}
                        onClick={() => setExpandedNote(cell)}
                        title="Click để xem đầy đủ"
                      >
                        {cell.slice(0, 30)}...
                      </td>
                    );
                  }
                  return <td key={cidx}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 🆕 Popup hiện ghi chú đầy đủ */}
      {expandedNote && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            boxShadow: '0px 0px 10px rgba(0,0,0,0.3)',
            zIndex: 1000,
            maxWidth: '600px'
          }}
        >
          <h3>Ghi Chú</h3>
          <p>{expandedNote}</p>
          <button
            onClick={() => setExpandedNote(null)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: 'red',
              color: 'white',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
