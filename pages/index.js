import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");

  // ✅ Tìm kiếm
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

  // ✅ Lấy giá từ sheet TEXT hoặc HOME
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find(row => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Copy 1 ô duy nhất khi double click
  const handleCellDoubleClick = (text) => {
    navigator.clipboard.writeText(text);
    alert(`✅ Đã copy: ${text}`);
  };

  // ✅ Quản lý nhiều ô được chọn
  const [selectedCells, setSelectedCells] = useState([]);

  const toggleCellSelection = (rowIdx, colIdx) => {
    const cellKey = `${rowIdx}-${colIdx}`;
    setSelectedCells((prev) =>
      prev.includes(cellKey)
        ? prev.filter((c) => c !== cellKey)
        : [...prev, cellKey]
    );
  };

  // ✅ Copy toàn bộ ô đã chọn
  const copySelectedCells = () => {
    const texts = [];
    selectedCells.forEach((cellKey) => {
      const [rowIdx, colIdx] = cellKey.split("-").map(Number);
      texts.push(data[rowIdx][colIdx]);
    });
    navigator.clipboard.writeText(texts.join("\n"));
    alert(`✅ Đã copy ${texts.length} ô!`);
  };

  // ✅ Ẩn ghi chú dài, click để mở rộng
  const renderCellContent = (text) => {
    if (typeof text === "string" && text.length > 30) {
      return (
        <span
          onClick={(e) => {
            e.target.innerText = text;
          }}
          style={{ cursor: "pointer", color: "#555" }}
        >
          {text.slice(0, 30)}... <em>(click để xem)</em>
        </span>
      );
    }
    return text;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <h2>Tool Check Site</h2>

      {/* Nhập site hoặc mã */}
      <textarea
        rows={3}
        style={{ width: "450px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        placeholder="Nhập site hoặc mã (cách nhau bằng dấu phẩy hoặc xuống dòng)"
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

      {/* Nút chuyển sheet */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setActiveSheet("GP")} style={{ marginRight: "10px" }}>GP</button>
          <button onClick={() => setActiveSheet("TEXT")} style={{ marginRight: "10px" }}>TEXT</button>
          <button onClick={() => setActiveSheet("HOME")}>HOME</button>
        </div>
      )}

      {/* Nút copy nhiều ô */}
      {selectedCells.length > 0 && (
        <button
          onClick={copySelectedCells}
          style={{
            marginTop: "10px",
            marginLeft: "10px",
            padding: "5px 12px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          📋 Copy {selectedCells.length} ô
        </button>
      )}

      {/* Bảng kết quả */}
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
            {data.map((row, rowIdx) => {
              const site = row[4];
              let rowCopy = [...row];

              if (activeSheet !== "GP") {
                const newPrice = getPriceFromOtherSheet(site, activeSheet);
                if (newPrice) {
                  rowCopy[9] = newPrice.giaBan;
                  rowCopy[10] = newPrice.giaMua;
                }
              }

              return (
                <tr key={rowIdx} style={{ borderBottom: "1px solid #eee" }}>
                  {rowCopy.map((cell, colIdx) => {
                    const cellKey = `${rowIdx}-${colIdx}`;
                    const isSelected = selectedCells.includes(cellKey);
                    return (
                      <td
                        key={colIdx}
                        onClick={() => toggleCellSelection(rowIdx, colIdx)} // ✅ chỉ chọn/bỏ chọn
                        onDoubleClick={() => handleCellDoubleClick(cell)} // ✅ double click mới copy nhanh 1 ô
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#cce5ff" : "transparent",
                          border: "1px solid #ddd",
                        }}
                      >
                        {renderCellContent(cell)}
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
