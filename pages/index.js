import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({}); // ✅ Quản lý ghi chú mở rộng

  // ✅ Gọi API tìm kiếm
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

  // ✅ Lấy giá từ sheet TEXT / HOME nếu chọn
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Toggle mở rộng / thu gọn ghi chú
  const toggleNote = (rowIndex) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* ✅ Textarea nhập site */}
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

      {/* ✅ Nút chọn sheet */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setActiveSheet("GP")}
            style={{
              marginRight: "10px",
              backgroundColor: activeSheet === "GP" ? "#007bff" : "#ddd",
              color: activeSheet === "GP" ? "#fff" : "#000",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            GP
          </button>
          <button
            onClick={() => setActiveSheet("TEXT")}
            style={{
              marginRight: "10px",
              backgroundColor: activeSheet === "TEXT" ? "#007bff" : "#ddd",
              color: activeSheet === "TEXT" ? "#fff" : "#000",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            TEXT
          </button>
          <button
            onClick={() => setActiveSheet("HOME")}
            style={{
              backgroundColor: activeSheet === "HOME" ? "#007bff" : "#ddd",
              color: activeSheet === "HOME" ? "#fff" : "#000",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            HOME
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
            userSelect: "text", // ✅ Quan trọng để bôi đen & Ctrl+C
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
                    const isNoteColumn = header[colIndex] === "Ghi Chú";
                    let displayCell = cell;

                    if (isNoteColumn && cell && cell.length > 50) {
                      const isExpanded = expandedNotes[rowIndex];
                      displayCell = isExpanded ? (
                        <>
                          {cell}{" "}
                          <span
                            style={{ color: "blue", cursor: "pointer" }}
                            onClick={() => toggleNote(rowIndex)}
                          >
                            [Thu gọn]
                          </span>
                        </>
                      ) : (
                        <>
                          {cell.slice(0, 50)}...
                          <span
                            style={{ color: "blue", cursor: "pointer" }}
                            onClick={() => toggleNote(rowIndex)}
                          >
                            [Xem thêm]
                          </span>
                        </>
                      );
                    }

                    return (
                      <td
                        key={colIndex}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          border: "1px solid #ddd",
                          whiteSpace: "pre-wrap",
                          maxWidth: isNoteColumn ? "300px" : "auto",
                        }}
                      >
                        {displayCell}
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
