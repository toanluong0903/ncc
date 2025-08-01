import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Tool Check Site (Demo)</h2>
      <textarea
        rows={3}
        style={{ width: "400px", padding: "5px" }}
        placeholder="Nhập site hoặc mã (có thể nhập nhiều, cách nhau bằng dấu phẩy hoặc xuống dòng)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <br />
      <button onClick={handleSearch} style={{ marginTop: "10px", padding: "8px 20px", backgroundColor: "green", color: "#fff" }}>
        Tìm kiếm
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {data.length > 0 && (
        <table border="1" style={{ marginTop: "20px", borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {["CS", "Tình Trạng", "Bóng", "BET", "Site", "Chủ đề", "DR", "Traffic", "Ghi Chú", "Giá Bán", "Giá Mua", "HH", "Giá Cuối", "LN", "Time", "Tên", "Mã"].map((header, i) => (
                <th key={i} style={{ padding: "5px", backgroundColor: "#eee" }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, i) => (
                  <td key={i} style={{ padding: "5px", textAlign: "center" }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
