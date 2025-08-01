import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: "Thiếu từ khóa tìm kiếm" });
    }

    // 🔥 Dọn input
    const cleanInput = keyword
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .trim();

    // 🔥 Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheet = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A1:Q",
    });

    const rows = sheet.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Không có dữ liệu" });
    }

    // 🔥 Bỏ hàng tiêu đề
    const data = rows.slice(1);

    // 🔥 Dọn dữ liệu trong sheet (cột Site và cột Mã)
    const clean = (str) =>
      (str || "")
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .trim();

    // 🔥 Lọc site hoặc mã
    const results = data.filter((row) => {
      const site = clean(row[4]);   // cột Site
      const code = clean(row[16]);  // cột Mã
      return site.includes(cleanInput) || code.includes(cleanInput);
    });

    if (results.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy" });
    }

    return res.status(200).json({ results });

  } catch (err) {
    console.error("🔥 Lỗi server:", err);
    return res.status(500).json({ error: "Lỗi server" });
  }
}
