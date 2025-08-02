import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [header, setHeader] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP"); // ✅ Sheet mặc định
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState({}); // ✅ Để ẩn/hiện ghi chú

  // ✅ Toggle ẩn/hiện ghi chú dài
  const toggleRow = (rowIndex) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowIndex]: !prev[rowIndex],
    }));
  };

  // ✅ Hàm tìm kiếm (gửi tên sheet nào đang chọn)
  const handleSearch = async () => {
    setError("");
    setData([]);

    try {
      const res = await fetch(
        `/api/check?keyword=${encodeURIComponent(input)}&sheet=${activeSheet}`
      );
      const json = await res.json();

      if (json.results) {
        setHeader(json.header);
        setData(json.results);
      } else {
        setError(json.message || "Không tìm thấy");
      }
    } catch (err) {
      setError("Lỗi server");
    }
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

      {/* Ô nhập site hoặc mã */}
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

      {/* ✅ 3 nút chọn sheet */}
      <div style={{ marginTop: "10px" }}>
        {["GP", "TEXT", "HOME"].map((sheet) => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            style={{
              marginRight: "10px",
              padding: "8px 15px",
              backgroundColor: activeSheet === sheet ? "#2E8B57" : "#ccc",
              color: activeSheet === sheet ? "#fff" : "#000",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* Nút tìm kiếm */}
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
            {data.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                {row.map((cell, i) => (
                  <td
                    key={i}
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      maxWidth: i === 8 ? "250px" : "auto",
                      wordBreak: "break-word",
                    }}
                  >
                    {/* ✅ CỘT GHI CHÚ – Thu gọn / Mở rộng */}
                    {i === 8 && cell && cell.length > 50 ? (
                      <span>
                        {expandedRows[idx]
                          ? cell
                          : `${cell.slice(0, 50)}... `}
                        <button
                          onClick={() => toggleRow(idx)}
                          style={{
                            color: "blue",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          {expandedRows[idx] ? "Thu gọn" : "Xem thêm"}
                        </button>
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
