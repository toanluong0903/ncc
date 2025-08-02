import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});

  const handleSearch = async () => {
    setError("");
    setData([]);
    try {
      const res = await fetch(`/api/check?keyword=${encodeURIComponent(input)}`);
      const json = await res.json();
      if (json.results) {
        setHeader(json.header);
        setData(json.results);
        setTextData(json.textData);
        setHomeData(json.homeData);
      } else {
        setError(json.message || "Không tìm thấy");
      }
    } catch (err) {
      setError("Lỗi server");
    }
  };

  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Toggle ghi chú dài (ẩn/bật)
  const toggleNote = (rowIndex) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial",
        backgroundColor: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <h2>Tool Check Site (Demo)</h2>

      {/* Ô nhập */}
      <textarea
        rows={3}
        style={{
          width: "450px",
          padding: "8px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
        placeholder="Nhập site hoặc mã (mỗi dòng 1 giá trị)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <br />
      <button
        onClick={handleSearch}
        style={{
          marginTop: "10px",
          padding: "10px 22px",
          backgroundColor: "#2E8B57",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        🔍 Tìm kiếm
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {/* Nút chọn Sheet */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setActiveSheet("GP")} style={{ marginRight: "10px" }}>
            GP
          </button>
          <button onClick={() => setActiveSheet("TEXT")} style={{ marginRight: "10px" }}>
            TEXT
          </button>
          <button onClick={() => setActiveSheet("HOME")}>HOME</button>
        </div>
      )}

      {/* ✅ Bảng kết quả – hỗ trợ Ctrl + C */}
      {data.length > 0 && (
        <table
          style={{
            marginTop: "20px",
            borderCollapse: "collapse",
            width: "100%",
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <thead>
            <tr>
              {header.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "10px",
                    backgroundColor: "#f0f0f0",
                    borderBottom: "2px solid #ddd",
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              const site = row[4];
              let rowCopy = [...row];

              // ✅ Nếu chọn TEXT hoặc HOME -> đổi giá
              if (activeSheet !== "GP") {
                const newPrice = getPriceFromOtherSheet(site, activeSheet);
                if (newPrice) {
                  rowCopy[9] = newPrice.giaBan;
                  rowCopy[10] = newPrice.giaMua;
                }
              }

              return (
                <tr key={rowIndex} style={{ borderBottom: "1px solid #eee" }}>
                  {rowCopy.map((cell, colIndex) => {
                    // ✅ Xử lý riêng cho cột Ghi Chú (index 8)
                    if (colIndex === 8 && typeof cell === "string" && cell.length > 30) {
                      const isExpanded = expandedNotes[rowIndex];
                      const displayText = isExpanded ? cell : cell.substring(0, 30) + "...";

                      return (
                        <td
                          key={colIndex}
                          onClick={() => toggleNote(rowIndex)}
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            border: "1px solid #ddd",
                            cursor: "pointer",
                            whiteSpace: "normal",
                            maxWidth: "300px",
                          }}
                        >
                          {displayText}
                          {!isExpanded && (
                            <span style={{ color: "blue", fontSize: "12px" }}> [Xem thêm]</span>
                          )}
                        </td>
                      );
                    }

                    // ✅ Các ô khác (Ctrl + C vẫn dùng bình thường)
                    return (
                      <td
                        key={colIndex}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          border: "1px solid #ddd",
                          userSelect: "text", // cho phép bôi đen và Ctrl + C
                        }}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
