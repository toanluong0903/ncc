import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  // ✅ Gọi API lấy dữ liệu
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

  // ✅ Lấy giá bán/mua từ sheet TEXT hoặc HOME nếu chọn
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Toggle xem thêm/thu gọn cho cột “Ghi chú”
  const toggleExpand = (rowIndex) => {
    setExpandedRows((prev) => ({
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

      {/* Ô nhập site/mã */}
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
      {/* Nút search */}
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

      {/* ✅ 3 nút GP/TEXT/HOME luôn hiển thị */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={() => setActiveSheet("GP")}
          style={{
            marginRight: "10px",
            backgroundColor: activeSheet === "GP" ? "#007bff" : "#e0e0e0",
            color: activeSheet === "GP" ? "#fff" : "#000",
            padding: "8px 16px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          GP
        </button>
        <button
          onClick={() => setActiveSheet("TEXT")}
          style={{
            marginRight: "10px",
            backgroundColor: activeSheet === "TEXT" ? "#007bff" : "#e0e0e0",
            color: activeSheet === "TEXT" ? "#fff" : "#000",
            padding: "8px 16px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          TEXT
        </button>
        <button
          onClick={() => setActiveSheet("HOME")}
          style={{
            backgroundColor: activeSheet === "HOME" ? "#007bff" : "#e0e0e0",
            color: activeSheet === "HOME" ? "#fff" : "#000",
            padding: "8px 16px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          HOME
        </button>
      </div>

      {/* ✅ Bảng kết quả */}
      {data.length > 0 && (
        <table
          style={{
            marginTop: "20px",
            borderCollapse: "collapse",
            width: "100%",
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            userSelect: "text", // Cho phép bôi đen như Excel
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

              // Nếu chọn TEXT/HOME → thay giá bán/mua
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
                    // ✅ Xử lý cột “Ghi Chú”
                    if (header[colIndex] === "Ghi Chú" && typeof cell === "string") {
                      const isLong = cell.length > 50;
                      const isExpanded = expandedRows[rowIndex];

                      return (
                        <td
                          key={colIndex}
                          style={{
                            padding: "8px",
                            textAlign: "left",
                            border: "1px solid #ddd",
                            cursor: "text",
                          }}
                        >
                          {isLong && !isExpanded ? cell.slice(0, 50) + "..." : cell}
                          {isLong && (
                            <span
                              onClick={() => toggleExpand(rowIndex)}
                              style={{
                                color: "blue",
                                marginLeft: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              {isExpanded ? "[Thu gọn]" : "[Xem thêm]"}
                            </span>
                          )}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={colIndex}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          cursor: "text",
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
