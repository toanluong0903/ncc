import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    // ✅ Lấy keyword (site hoặc mã) và sheet name từ query
    const { keyword, sheet } = req.query;
    if (!keyword) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    // ✅ Nếu không có sheet thì mặc định dùng GP
    const sheetName = sheet || "GP";

    // ✅ Kết nối Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID;

    // ✅ Lấy dữ liệu từ sheet tương ứng
    const range = `${sheetName}!A:Q`; // A:Q để bao hết cột
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    // ✅ Dòng đầu tiên là header
    const header = rows[0];
    const data = rows.slice(1);

    // ✅ Chuẩn hóa input (có thể nhập nhiều giá trị)
    const keywords = keyword
      .split(/\n|,/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k);

    // ✅ Lọc dữ liệu theo site (cột 5) hoặc mã (cột 17)
    const results = data.filter((row) => {
      const site = row[4]?.toLowerCase() || "";
      const code = row[16]?.toLowerCase() || "";
      return keywords.some((kw) => site === kw || code === kw);
    });

    if (results.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy" });
    }

    return res.status(200).json({
      header,
      results,
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}
