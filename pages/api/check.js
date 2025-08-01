import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.SHEET_ID;
    const range = "Sheet1!A2:Q"; // đọc tất cả dữ liệu từ cột A đến Q

    const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu" });
    }

    // 🏷 Lấy keywords từ người dùng (site hoặc mã)
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });

    const keywords = keyword
      .split(/[\n,\s]+/) // hỗ trợ ngăn cách bằng xuống dòng, dấu phẩy, hoặc khoảng trắng
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k);

    // 🔍 Tìm theo Site hoặc Mã
    const matchedRows = rows.filter((row) => {
      const site = (row[4] || "").toLowerCase();
      const code = (row[16] || "").toLowerCase();
      return keywords.some((k) => site.includes(k) || code.includes(k));
    });

    if (matchedRows.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy" });
    }

    res.status(200).json({ results: matchedRows });
  } catch (error) {
    console.error("Lỗi Google Sheets API:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}
