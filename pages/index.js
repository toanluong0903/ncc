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
    <div className="p-10 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Tool Check Site (Demo)</h1>
        <button className="text-red-500 underline" onClick={handleLogout}>Logout</button>
      </div>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Nhập site (ví dụ: licham.vn)"
        value={site}
        onChange={(e) => setSite(e.target.value)}
      />
      <button className="bg-green-500 text-white p-2 w-full" onClick={handleSearch}>
        Tìm kiếm
      </button>

      {data && (
        <div className="mt-5 border p-4 bg-gray-50">
          <h2 className="font-bold">Kết quả:</h2>
          {data.message ? (
            <p>{data.message}</p>
          ) : (
            <ul>
              <li><b>Tình trạng:</b> {data.TinhTrang}</li>
              <li><b>Chủ đề:</b> {data.ChuDe}</li>
              <li><b>DR:</b> {data.DR}</li>
              <li><b>Traffic:</b> {data.Traffic}</li>
              <li><b>Giá Bán:</b> {data.GiaBan}</li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}