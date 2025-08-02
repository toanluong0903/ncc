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
  const [lastClicked, setLastClicked] = useState(null);

  // ✅ Tìm kiếm site
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

  // ✅ Lấy giá từ sheet TEXT/HOME nếu người dùng chuyển
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Xử lý click chọn ô (Ctrl + click chọn nhiều, Shift + click chọn vùng)
  const handleCellClick = (rowIndex, colIndex, event) => {
    const cellId = `${rowIndex}-${colIndex}`;
    const newSelection = new Set(selectedCells);

    if (event.shiftKey && lastClicked) {
      // Chọn vùng (Shift)
      const [lastRow, lastCol] = lastClicked.split("-").map(Number);
      const rowStart = Math.min(lastRow, rowIndex);
      const rowEnd = Math.max(lastRow, rowIndex);
      const colStart = Math.min(lastCol, colIndex);
      const colEnd = Math.max(lastCol, colIndex);

      for (let r = rowStart; r <= rowEnd; r++) {
        for (let c = colStart; c <= colEnd; c++) {
          newSelection.add(`${r}-${c}`);
        }
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Chọn thêm (Ctrl)
      if (newSelection.has(cellId)) {
        newSelection.delete(cellId);
      } else {
        newSelection.add(cellId);
      }
      setLastClicked(cellId);
    } else {
      // Click thường (chỉ chọn 1 ô)
      newSelection.clear();
      newSelection.add(cellId);
      setLastClicked(cellId);
    }
    setSelectedCells(newSelection);
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

      {/* ✅ Ô nhập site */}
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

      {/* ✅ Nút tìm kiếm */}
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

      {/* ✅ Nút chọn sheet GP/TEXT/HOME */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          {["GP", "TEXT", "HOME"].map((sheet) => (
            <button
              key={sheet}
              onClick={() => setActiveSheet(sheet)}
              style={{
                marginRight: "10px",
                backgroundColor: activeSheet === sheet ? "#2E8B57" : "#ddd",
                color: activeSheet === sheet ? "#fff" : "#000",
                border: "none",
                padding: "8px 14px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              {sheet}
            </button>
          ))}
        </div>
      )}

      {/* ✅ Bảng hiển thị dữ liệu */}
      {data.length > 0 && (
        <table
          style={{
            marginTop: "20px",
            borderCollapse: "collapse",
            width: "100%",
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            userSelect: "none", // 👉 Ngăn bôi đen chữ default
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

              // ✅ Cập nhật giá nếu chuyển sang TEXT/HOME
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
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          cursor: "pointer",
                          border: "1px solid #ddd",
                          maxWidth: "250px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          backgroundColor: isSelected ? "#cce5ff" : "transparent",
                        }}
                        title={cell} // 👉 Hover hiện full text
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
