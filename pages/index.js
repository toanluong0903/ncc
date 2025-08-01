import { useState, useEffect } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP"); // GP - TEXT - HOME
  const [expandedNotes, setExpandedNotes] = useState([]); // <-- Thêm state cho ghi chú

  // Hàm toggle để bung/thu gọn ghi chú
  const toggleExpand = (index) => {
    setExpandedNotes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, sheet: activeSheet }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setExpandedNotes([]); // reset trạng thái ghi chú khi search mới
    } catch (error) {
      console.error("Lỗi search:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Tool Check Site (Demo)</h2>

      {/* Ô nhập nhiều site hoặc mã */}
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={4}
        cols={50}
        placeholder="Nhập site hoặc mã (mỗi dòng một mục)"
        style={{ display: "block", marginBottom: "10px" }}
      />

      <button
        onClick={handleSearch}
        style={{
          padding: "10px 20px",
          background: "green",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        🔍 Tìm kiếm
      </button>

      {/* Tabs chọn Sheet */}
      <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        {["GP", "TEXT", "HOME"].map((sheet) => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            style={{
              marginRight: "10px",
              padding: "5px 15px",
              background: activeSheet === sheet ? "black" : "lightgray",
              color: activeSheet === sheet ? "white" : "black",
              cursor: "pointer",
              border: "none",
            }}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* Bảng kết quả */}
      {results.length > 0 ? (
        <table
          border="1"
          cellPadding="5"
          style={{ borderCollapse: "collapse", marginTop: "20px", width: "100%" }}
        >
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th>CS</th>
              <th>Tình Trạng</th>
              <th>Bóng</th>
              <th>BET</th>
              <th>Site</th>
              <th>Chủ đề</th>
              <th>DR</th>
              <th>Traffic</th>
              <th>Ghi Chú</th>
              <th>Giá Bán</th>
              <th>Giá Mua</th>
              <th>HH</th>
              <th>Giá Cuối</th>
              <th>LN</th>
              <th>Time</th>
              <th>Tên</th>
              <th>Mã</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index}>
                <td>{row["CS"]}</td>
                <td>{row["Tình Trạng"]}</td>
                <td>{row["Bóng"]}</td>
                <td>{row["BET"]}</td>
                <td>{row["Site"]}</td>
                <td>{row["Chủ đề"]}</td>
                <td>{row["DR"]}</td>
                <td>{row["Traffic"]}</td>

                {/* --- Cột Ghi chú với tính năng ẩn/hiện --- */}
                <td>
                  {row["Ghi Chú"] && row["Ghi Chú"].length > 50 ? (
                    <span>
                      {expandedNotes.includes(index)
                        ? row["Ghi Chú"]
                        : row["Ghi Chú"].substring(0, 50) + "... "}
                      <button
                        onClick={() => toggleExpand(index)}
                        style={{
                          color: "blue",
                          cursor: "pointer",
                          border: "none",
                          background: "none",
                        }}
                      >
                        {expandedNotes.includes(index) ? "Thu gọn" : "Xem thêm"}
                      </button>
                    </span>
                  ) : (
                    row["Ghi Chú"]
                  )}
                </td>

                <td>{row["Giá Bán"]}</td>
                <td>{row["Giá Mua"]}</td>
                <td>{row["HH"]}</td>
                <td>{row["Giá Cuối"]}</td>
                <td>{row["LN"]}</td>
                <td>{row["Time"]}</td>
                <td>{row["Tên"]}</td>
                <td>{row["Mã"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ marginTop: "20px", color: "red" }}>Không có kết quả</p>
      )}
    </div>
  );
}
