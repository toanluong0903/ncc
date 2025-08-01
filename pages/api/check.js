// ✅ pages/api/check.js – Lấy nhiều site/mã cùng lúc
import { google } from "googleapis";

export default async function handler(req, res) {
  const { query } = req;
  const input = (query.site || "").toLowerCase().trim();

  // ✅ Tách input thành mảng (theo dấu phẩy, dấu cách, hoặc xuống dòng)
  const searchList = input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s);

  try {
    // ✅ Kết nối Google Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ✅ Đọc dữ liệu từ Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A2:Q", // ⚠️ Đổi nếu sheet bạn khác tên
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    // ✅ Lọc: match nếu cột Site (E – index 4) hoặc Mã (Q – index 16) nằm trong danh sách tìm
    const results = rows.filter(
      (row) =>
        searchList.includes(row[4]?.toLowerCase()) ||
        searchList.includes(row[16]?.toLowerCase())
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy site/mã nào" });
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error("❌ Lỗi Google Sheets API:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
}
