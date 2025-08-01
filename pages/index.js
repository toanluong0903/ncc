// ✅ pages/index.js – Giao diện tìm kiếm & hiển thị kết quả dạng bảng
import { useState } from "react";
import cookies from "js-cookie";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [site, setSite] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // ✅ User login tạm
  const USERS = [
    { user: "admin", pass: "123456" },
    { user: "user1", pass: "abc123" },
    { user: "user2", pass: "xyz789" },
  ];

  const handleLogin = () => {
    const found = USERS.find((u) => u.user === username && u.pass === password);
    if (found) {
      cookies.set("loggedIn", true);
      setError("");
    } else {
      setError("Sai tài khoản hoặc mật khẩu");
    }
  };

  const handleLogout = () => {
    cookies.remove("loggedIn");
    setData(null);
    setSite("");
  };

  // ✅ Gọi API tìm kiếm
  const handleSearch = async () => {
    try {
      const res = await fetch(`/api/check?site=${site}`);
      const json = await res.json();
      if (json.results) {
        setData(json);
        setError("");
      } else {
        setData(null);
        setError(json.message || "Không tìm thấy");
      }
    } catch (err) {
      setError("Không thể lấy dữ liệu");
    }
  };

  // ✅ Nếu chưa login → hiển thị form login
  if (!cookies.get("loggedIn")) {
    return (
      <div className="p-10 max-w-sm mx-auto">
        <h1 className="text-xl font-bold mb-4">Đăng nhập</h1>
        <input
          className="border p-2 mb-2 w-full"
          placeholder="User"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border p-2 mb-2 w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500">{error}</p>}
        <button
          className="bg-blue-500 text-white p-2 w-full"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    );
  }

  // ✅ Nếu đã login → hiển thị tool
  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Tool Check Site (Demo)</h1>
        <button className="text-red-500 underline" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <input
        className="border p-2 mb-2 w-full"
        placeholder="Nhập Site hoặc Mã (VD: licham.vn hoặc CC401)"
        value={site}
        onChange={(e) => setSite(e.target.value)}
      />
      <button
        className="bg-green-500 text-white p-2 w-full mb-4"
        onClick={handleSearch}
      >
        Tìm kiếm
      </button>

      {/* ✅ Nếu có lỗi hiển thị */}
      {error && <p className="text-red-500">{error}</p>}

      {/* ✅ Nếu có dữ liệu → render bảng */}
      {data?.results && (
        <div className="overflow-x-auto">
          <table className="border-collapse border border-gray-400 w-full">
            <thead>
              <tr className="bg-gray-200">
                {[
                  "CS",
                  "Tình Trạng",
                  "Bóng",
                  "BET",
                  "Site",
                  "Chủ đề",
                  "DR",
                  "Traffic",
                  "Ghi Chú",
                  "Giá Bán",
                  "Giá Mua",
                  "HH",
                  "Giá Cuối",
                  "LN",
                  "Time",
                  "Tên",
                  "Mã",
                ].map((header) => (
                  <th key={header} className="border border-gray-400 px-2 py-1">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.results.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className="border border-gray-300 px-2 py-1 text-center"
                    >
                      {cell || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
