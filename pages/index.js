import { useState } from "react";
import cookies from "js-cookie";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [site, setSite] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // ✅ 3 user hardcode (bạn có thể đổi user/pass theo ý mình)
  const USERS = [
    { user: "admin", pass: "123456" },
    { user: "user1", pass: "abc123" },
    { user: "user2", pass: "xyz789" }
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

  const handleSearch = async () => {
    try {
      const res = await fetch(`/api/check?site=${site}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Không thể lấy dữ liệu");
    }
  };

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
        <button className="bg-blue-500 text-white p-2 w-full" onClick={handleLogin}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Tool Check Site (Demo)</h1>
        <button className="text-red-500 underline" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Nhập site hoặc mã (ví dụ: licham.vn hoặc CC310)"
        value={site}
        onChange={(e) => setSite(e.target.value)}
      />
      <button className="bg-green-500 text-white p-2 w-full" onClick={handleSearch}>
        Tìm kiếm
      </button>

      {data && (
        <div className="mt-5 border p-4 bg-gray-50">
          <h2 className="font-bold">Kết quả:</h2>

          {/* Nếu tìm theo site (1 kết quả duy nhất) */}
          {data.type === "site" && (
            <table className="table-auto border-collapse border border-gray-400 mt-2 w-full text-sm">
              <thead>
                <tr>
                  {Object.keys(data.data).map((header, i) => (
                    <th
                      key={i}
                      className="border border-gray-400 px-2 py-1 bg-gray-100"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {Object.values(data.data).map((value, i) => (
                    <td key={i} className="border border-gray-400 px-2 py-1">
                      {value}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}

          {/* Nếu tìm theo mã (nhiều site) */}
          {data.type === "ma" && (
            <table className="table-auto border-collapse border border-gray-400 mt-2 w-full text-sm">
              <thead>
                <tr>
                  {data.headers.map((header, i) => (
                    <th
                      key={i}
                      className="border border-gray-400 px-2 py-1 bg-gray-100"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {data.headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-gray-400 px-2 py-1"
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
