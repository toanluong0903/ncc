import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");

  // 📌 Gọi API check site
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

  // 📌 Lấy giá từ Text/Home
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
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

      {/* Ô nhập site */}
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
          <button
            onClick={() => setActiveSheet("GP")}
            style={{
              marginRight: "10px",
              backgroundColor: activeSheet === "GP" ? "#1E90FF" : "#f0f0f0",
              color: activeSheet === "GP" ? "#fff" : "#000",
              fontWeight: "bold",
              padding: "6px 14px",
              borderRadius: "6px",
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
              backgroundColor: activeSheet === "TEXT" ? "#1E90FF" : "#f0f0f0",
              color: activeSheet === "TEXT" ? "#fff" : "#000",
              fontWeight: "bold",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            TEXT
          </button>
          <button
            onClick={() => setActiveSheet("HOME")}
            style={{
              backgroundColor: activeSheet === "HOME" ? "#1E90FF" : "#f0f0f0",
              color: activeSheet === "HOME" ? "#fff" : "#000",
              fontWeight: "bold",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            HOME
          </button>
        </div>
      )}

      {/* ✅ Bảng kết quả */}
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
                <tr
                  key={rowIndex}
                  style={{
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {rowCopy.map((cell, colIndex) => {
                    // ✅ Check cột "Ghi Chú" (index = 9 hay 8 tuỳ dữ liệu)
                    const isNoteColumn = header[colIndex] === "Ghi Chú";

                    return (
                      <td
                        key={colIndex}
                        className={isNoteColumn ? "note-cell" : ""}
                        onClick={(e) => {
                          if (isNoteColumn) {
                            e.currentTarget.classList.toggle("expanded");
                          }
                        }}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          border: "1px solid #ddd",
                          cursor: isNoteColumn ? "pointer" : "text",
                          userSelect: "text", // ✅ cho phép Ctrl+C
                          maxWidth: isNoteColumn ? "180px" : "auto",
                          whiteSpace: isNoteColumn ? "nowrap" : "normal",
                          overflow: isNoteColumn ? "hidden" : "visible",
                          textOverflow: isNoteColumn ? "ellipsis" : "clip",
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

      {/* ✅ CSS inline cho expanded (mở rộng ghi chú) */}
      <style jsx>{`
        .note-cell.expanded {
          white-space: normal !important;
          max-width: none !important;
        }
      `}</style>
    </div>
  );
}
