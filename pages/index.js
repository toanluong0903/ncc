import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP");
  const [error, setError] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({}); // ✅ trạng thái theo dõi ghi chú đã mở rộng

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

  // 🟢 Lấy giá từ TEXT hoặc HOME nếu activeSheet thay đổi
  const getPriceFromOtherSheet = (site, sheet) => {
    const source = sheet === "TEXT" ? textData : homeData;
    const match = source.find((row) => row[4] === site);
    if (match) {
      return { giaBan: match[9] || "", giaMua: match[10] || "" };
    }
    return null;
  };

  // ✅ Hàm toggle mở rộng ghi chú
  const toggleNote = (index) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [index]: !prev[index],
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

      {/* Ô nhập */}
      <textarea
        rows={3}
        style={{
          width: "450px",
          padding: "8px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
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

      {/* Nút chuyển sheet */}
      {data.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setActiveSheet("GP")}
            style={{ marginRight: "10px" }}
          >
            GP
          </button>
          <button
            onClick={() => setActiveSheet("TEXT")}
            style={{ marginRight: "10px" }}
          >
            TEXT
          </button>
          <button onClick={() => setActiveSheet("HOME")}>HOME</button>
        </div>
      )}

      {/* Hiển thị kết quả */}
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
            {data.map((row, idx) => {
              const site = row[4];
              let rowCopy = [...row];

              // 🟢 Nếu chuyển sang TEXT hoặc HOME -> chỉ thay Giá Bán (cột 9) & Giá Mua (cột 10)
              if (activeSheet !== "GP") {
                const newPrice = getPriceFromOtherSheet(site, activeSheet);
                if (newPrice) {
                  rowCopy[9] = newPrice.giaBan;
                  rowCopy[10] = newPrice.giaMua;
                }
              }

              return (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  {rowCopy.map((cell, i) => {
                    // ✅ Cột Ghi Chú (index 8)
                    if (i === 8 && typeof cell === "string" && cell.length > 40) {
                      const isExpanded = expandedNotes[idx];
                      const shortText = cell.slice(0, 40) + "...";

                      return (
                        <td
                          key={i}
                          style={{ padding: "8px", textAlign: "center" }}
                        >
                          {isExpanded ? cell : shortText}{" "}
                          <span
                            onClick={() => toggleNote(idx)}
                            style={{
                              color: "blue",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            [{isExpanded ? "Thu gọn" : "Xem thêm"}]
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={i} style={{ padding: "8px", textAlign: "center" }}>
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
