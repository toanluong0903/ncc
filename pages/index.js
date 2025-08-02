import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");

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

  // ✅ Lấy giá từ sheet khác nếu đổi TEXT/HOME
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Double click để copy nhanh 1 ô
  const handleDoubleClickCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert(`✅ Đã copy: ${text}`);
  };

  // ✅ Toggle “xem thêm” ghi chú
  const [expandedRows, setExpandedRows] = useState({});
  const toggleExpand = (rowIndex) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* ✅ Nhập site */}
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
          <button
            onClick={() => setActiveSheet("GP")}
            style={{
              marginRight: "10px",
              padding: "6px 16px",
              fontWeight: activeSheet === "GP" ? "bold" : "normal",
              background: activeSheet === "GP" ? "#2E8B57" : "#f0f0f0",
              color: activeSheet === "GP" ? "white" : "black",
              borderRadius: "4px",
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
              padding: "6px 16px",
              fontWeight: activeSheet === "TEXT" ? "bold" : "normal",
              background: activeSheet === "TEXT" ? "#2E8B57" : "#f0f0f0",
              color: activeSheet === "TEXT" ? "white" : "black",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            TEXT
          </button>
          <button
            onClick={() => setActiveSheet("HOME")}
            style={{
              padding: "6px 16px",
              fontWeight: activeSheet === "HOME" ? "bold" : "normal",
              background: activeSheet === "HOME" ? "#2E8B57" : "#f0f0f0",
              color: activeSheet === "HOME" ? "white" : "black",
              borderRadius: "4px",
              border: "none",
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
                    userSelect: "text", // ✅ Cho phép bôi đen
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
                    // ✅ Thu gọn ghi chú dài
                    const isNote = header[colIndex] === "Ghi Chú";
                    const isExpanded = expandedRows[rowIndex];
                    const textDisplay =
                      isNote && !isExpanded && cell?.length > 50
                        ? `${cell.slice(0, 50)}...`
                        : cell;

                    return (
                      <td
                        key={colIndex}
                        onDoubleClick={() => handleDoubleClickCopy(cell)}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          border: "1px solid #ddd",
                          cursor: "text", // ✅ Cho phép highlight text
                          userSelect: "text", // ✅ Rất quan trọng để Ctrl/Shift hoạt động
                        }}
                      >
                        {isNote && cell?.length > 50 ? (
                          <>
                            {textDisplay}{" "}
                            {!isExpanded && (
                              <span
                                onClick={() => toggleExpand(rowIndex)}
                                style={{
                                  color: "blue",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                [Xem thêm]
                              </span>
                            )}
                          </>
                        ) : (
                          textDisplay
                        )}
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
