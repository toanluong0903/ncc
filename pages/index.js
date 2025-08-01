import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({}); // trạng thái mở rộng cho từng hàng

  const handleSearch = async () => {
    setError("");
    setData([]);
    try {
      const res = await fetch(`/api/check?keyword=${encodeURIComponent(input)}`);
      const json = await res.json();
      if (json.results) {
        setData(json.results);
      } else {
        setError(json.message || "Không tìm thấy");
      }
    } catch (err) {
      setError("Lỗi server");
    }
  };

  const toggleExpand = (index) => {
    setExpanded((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "10px" }}>Tool Check Site (Demo)</h2>
      
      {/* Ô nhập liệu */}
      <textarea
        rows={3}
        style={{ width: "450px", padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        placeholder="Nhập site hoặc mã (nhiều giá trị cách nhau bằng dấu phẩy hoặc xuống dòng)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <br />
      
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
              {["CS", "Tình Trạng", "Bóng", "BET", "Site", "Chủ đề", "DR", "Traffic", "Ghi Chú", "Giá Bán", "Giá Mua", "HH", "Giá Cuối", "LN", "Time", "Tên", "Mã"].map((header, i) => (
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
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                {row.map((cell, i) => {
                  if (i === 8) { // cột Ghi chú
                    const isExpanded = expanded[idx];
                    return (
                      <td key={i} style={{ padding: "8px", textAlign: "center", maxWidth: "200px" }}>
                        {cell && cell.length > 50 ? (
                          <>
                            {isExpanded ? cell : cell.slice(0, 50) + "... "}
                            <button
                              onClick={() => toggleExpand(idx)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#007BFF",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              {isExpanded ? "Thu gọn" : "Xem thêm"}
                            </button>
                          </>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  } else {
                    return (
                      <td key={i} style={{ padding: "8px", textAlign: "center" }}>
                        {cell}
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
