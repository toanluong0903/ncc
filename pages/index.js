import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");

  // 🟢 Multi-select highlight
  const [selectedCells, setSelectedCells] = useState([]);

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

  // 🟢 Lấy giá từ TEXT hoặc HOME khi đổi sheet
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // 🟢 Xử lý double-click để copy nhanh
  const handleDoubleClick = (text) => {
    navigator.clipboard.writeText(text);
    alert(`📋 Đã copy: ${text}`);
  };

  // 🟢 Xử lý chọn nhiều ô (multi-select)
  const handleCellClick = (rowIdx, colIdx, cellValue) => {
    const key = `${rowIdx}-${colIdx}`;
    setSelectedCells((prev) => {
      if (prev.some((c) => c.key === key)) {
        return prev.filter((c) => c.key !== key); // bỏ chọn nếu đã chọn
      } else {
        return [...prev, { key, value: cellValue }];
      }
    });
  };

  // 🟢 Copy toàn bộ ô đã chọn
  const handleCopySelected = () => {
    const text = selectedCells.map((c) => c.value).join("\n");
    navigator.clipboard.writeText(text);
    alert(`📋 Đã copy ${selectedCells.length} ô:\n${text}`);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* Ô nhập */}
      <textarea
        rows={3}
        style={{ width: "450px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        placeholder="Nhập site hoặc mã (nhiều giá trị cách nhau bằng dấu phẩy hoặc xuống dòng)"
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

      {/* ✅ Switch GP–TEXT–HOME */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => setActiveSheet("GP")} style={{ marginRight: "10px" }}>GP</button>
          <button onClick={() => setActiveSheet("TEXT")} style={{ marginRight: "10px" }}>TEXT</button>
          <button onClick={() => setActiveSheet("HOME")}>HOME</button>
        </div>
      )}

      {/* ✅ Nút copy nhiều ô */}
      {selectedCells.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <button onClick={handleCopySelected} style={{ padding: "5px 15px", backgroundColor: "#007BFF", color: "#fff", border: "none", borderRadius: "5px" }}>
            📋 Copy {selectedCells.length} ô đã chọn
          </button>
        </div>
      )}

      {/* ✅ Hiển thị kết quả */}
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

              // 🔄 Khi đổi sang TEXT hoặc HOME, chỉ thay giá
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
                    const key = `${rowIdx}-${colIdx}`;
                    const isSelected = selectedCells.some((c) => c.key === key);

                    return (
                      <td
                        key={colIdx}
                        onClick={() => handleCellClick(rowIdx, colIdx, cell)}
                        onDoubleClick={() => handleDoubleClick(cell)}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#d0ebff" : "transparent",
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
