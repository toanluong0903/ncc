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

  // ✅ Search từ API
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

  // ✅ Lấy giá bán/mua từ sheet TEXT hoặc HOME
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Double click để copy 1 ô
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

  // ✅ Copy tất cả ô đã chọn (copy theo dạng hàng ngang)
  const handleCopySelected = () => {
    if (selectedCells.size === 0) return;

    // Gom theo từng hàng (row)
    const rowMap = {};
    selectedCells.forEach((id) => {
      const [row, col] = id.split("-").map(Number);
      if (!rowMap[row]) rowMap[row] = [];
      rowMap[row].push({ col, value: data[row][col] });
    });

    // Sắp xếp theo thứ tự cột
    const sortedRows = Object.keys(rowMap)
      .sort((a, b) => a - b)
      .map((row) =>
        rowMap[row]
          .sort((a, b) => a.col - b.col)
          .map((cell) => cell.value)
          .join("\t") // copy ngang (tab)
      );

    const finalText = sortedRows.join("\n"); // mỗi hàng xuống dòng
    navigator.clipboard.writeText(finalText);
    alert(`✅ Đã copy ${selectedCells.size} ô (${sortedRows.length} hàng)!`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* Ô nhập liệu */}
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

      {/* ✅ 3 nút chọn Sheet (GP, TEXT, HOME) */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setActiveSheet("GP")}
            style={{
              marginRight: "10px",
              backgroundColor: activeSheet === "GP" ? "#28a745" : "#ccc",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            GP
          </button>
          <button
            onClick={() => setActiveSheet("TEXT")}
            style={{
              marginRight: "10px",
              backgroundColor: activeSheet === "TEXT" ? "#28a745" : "#ccc",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            TEXT
          </button>
          <button
            onClick={() => setActiveSheet("HOME")}
            style={{
              backgroundColor: activeSheet === "HOME" ? "#28a745" : "#ccc",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            HOME
          </button>
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

      {/* ✅ Hiển thị bảng kết quả */}
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

              // ✅ Nếu đổi sang TEXT hoặc HOME -> chỉ thay Giá Bán & Giá Mua
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
                          userSelect: "text", // ✅ vẫn Ctrl+C thủ công được
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
