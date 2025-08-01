import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.SHEET_ID;
    const range = "NCC MIU SEO!A1:Q"; // ✅ đúng tên sheet

    // Lấy dữ liệu từ Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy dữ liệu" });
    }

    // Bỏ dòng tiêu đề (dòng 1)
    const data = rows.slice(1);

    // Lấy input từ người dùng
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    const keywords = query.toLowerCase().split(/\s+/); // hỗ trợ nhập nhiều site/mã

    // Tìm dữ liệu trong cột Site (E) hoặc Mã (Q)
    const results = data.filter(row => {
      const site = row[4]?.toLowerCase() || ""; // cột E
      const code = row[16]?.toLowerCase() || ""; // cột Q
      return keywords.some(kw => site.includes(kw) || code.includes(kw));
    });

    if (results.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy" });
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Lỗi server:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}
