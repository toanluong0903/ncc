import { useState } from "react";

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

  // ✅ Double click copy 1 ô
  const handleDoubleClickCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`✅ Đã copy: ${text}`);
  };

  // ✅ Click chọn nhiều ô
  const handleCellClick = (rowIndex, colIndex) => {
    const cellId = `${rowIndex}-${colIndex}`;
    const newSelection = new Set(selectedCells);

    if (newSelection.has(cellId)) {
      newSelection.delete(cellId);
    } else {
      newSelection.add(cellId);
    }
    setSelectedCells(newSelection);
  };

  // ✅ Copy tất cả ô đã chọn
  const handleCopySelected = () => {
    const texts = Array.from(selectedCells).map((id) => {
      const [row, col] = id.split("-").map(Number);
      return data[row][col];
    });
    navigator.clipboard.writeText(texts.join("\n"));
    alert(`✅ Đã copy ${texts.length} ô!`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h2>Tool Check Site (Demo)</h2>

      <textarea
        rows={3}
        style={{ width: "450px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        placeholder="Nhập site hoặc mã (mỗi dòng 1 giá trị)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <br />
      {/* ✅ Nút search */}
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

      {/* ✅ Nút chọn Sheet */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setActiveSheet("GP")} style={{ marginRight: "10px" }}>GP</button>
          <button onClick={() => setActiveSheet("TEXT")} style={{ marginRight: "10px" }}>TEXT</button>
          <button onClick={() => setActiveSheet("HOME")}>HOME</button>
        </div>
      )}

      {/* ✅ Copy các ô đã chọn */}
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

      {/* ✅ Hiển thị bảng */}
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

              // ✅ Nếu đổi sang TEXT hoặc HOME -> chỉ thay Giá Bán (cột 9) & Giá Mua (cột 10)
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
                        onDoubleClick={() => handleDoubleClickCopy(cell)}
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
