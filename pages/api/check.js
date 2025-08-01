// ✅ pages/api/check.js – Lấy dữ liệu từ Google Sheet (hỗ trợ tìm theo Site hoặc Mã)
import { google } from "googleapis";

export default async function handler(req, res) {
  const { query } = req;
  const input = (query.site || "").toLowerCase().trim();

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
      range: "Sheet1!A2:Q", // ⚠️ Đổi tên sheet & range nếu cần
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    // ✅ Filter theo Site (cột E – index 4) hoặc Mã (cột Q – index 16)
    const results = rows.filter(
      (row) =>
        row[4]?.toLowerCase() === input || row[16]?.toLowerCase() === input
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy site/mã" });
    }

    // ✅ Trả về toàn bộ kết quả dạng mảng
    return res.status(200).json({ results });
  } catch (error) {
    console.error("❌ Lỗi Google Sheets API:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
}
