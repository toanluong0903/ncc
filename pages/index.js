import { useState, useEffect } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");
  const [selectedCells, setSelectedCells] = useState(new Set());

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

  // ✅ Click chọn nhiều ô
  const handleCellClick = (rowIndex, colIndex) => {
    const cellId = `${rowIndex}-${colIndex}`;
    const newSelection = new Set(selectedCells);
    newSelection.has(cellId) ? newSelection.delete(cellId) : newSelection.add(cellId);
    setSelectedCells(newSelection);
  };

  // ✅ Nút copy – copy tất cả các ô được chọn
  const handleCopySelected = () => {
    const text = getCopiedText();
    navigator.clipboard.writeText(text);
    alert(`✅ Đã copy ${selectedCells.size} ô`);
  };

  // ✅ Tạo text để copy (1 hàng ngang)
  const getCopiedText = () => {
    const selected = Array.from(selectedCells).map(id => {
      const [row, col] = id.split("-").map(Number);
      return { row, col, value: data[row][col] };
    });

    // Sort theo row, col
    selected.sort((a, b) => (a.row - b.row) || (a.col - b.col));

    // 👉 Dồn tất cả thành 1 HÀNG NGANG (cách nhau tab)
    return selected.map(c => c.value).join("\t");
  };

  // ✅ Dùng Ctrl+C
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "c" && selectedCells.size > 0) {
        e.preventDefault();
        const text = getCopiedText();
        navigator.clipboard.writeText(text);
        alert(`✅ Đã copy ${selectedCells.size} ô bằng Ctrl+C`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCells]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* Ô nhập */}
      <textarea
        rows={3}
        style={{ width: "450px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        placeholder="Nhập site hoặc mã (mỗi dòng 1 giá trị)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <br />
      <button
        onClick={handleSearch}
        style={{ marginTop: "10px", padding: "10px 22px", backgroundColor: "#2E8B57", color: "#fff", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}
      >
        🔍 Tìm kiếm
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setActiveSheet("GP")} style={{ marginRight: "10px" }}>GP</button>
          <button onClick={() => setActiveSheet("TEXT")} style={{ marginRight: "10px" }}>TEXT</button>
          <button onClick={() => setActiveSheet("HOME")}>HOME</button>
        </div>
      )}

      {selectedCells.size > 0 && (
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={handleCopySelected}
            style={{
              backgroundColor: "#007bff",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            📋 Copy {selectedCells.size} ô
          </button>
        </div>
      )}

      {data.length > 0 && (
        <table style={{ marginTop: "20px", borderCollapse: "collapse", width: "100%", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <thead>
            <tr>
              {header.map((h, i) => (
                <th key={i} style={{ padding: "10px", backgroundColor: "#f0f0f0", borderBottom: "2px solid #ddd", fontWeight: "bold", textAlign: "center" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
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
                <tr key={rowIndex} style={{ borderBottom: "1px solid #eee" }}>
                  {rowCopy.map((cell, colIndex) => {
                    const cellId = `${rowIndex}-${colIndex}`;
                    const isSelected = selectedCells.has(cellId);

                    return (
                      <td
                        key={colIndex}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#cce5ff" : "transparent",
                          border: "1px solid #ddd",
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
