import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });

    // 🟢 Kết nối Google API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = process.env.SHEET_ID;

    // 🟢 Lấy dữ liệu từ 3 sheet cùng lúc
    const [gpSheet, textSheet, homeSheet] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: "GP!A1:Q" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "TEXT!A1:Q" }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: "HOME!A1:Q" }),
    ]);

    const gpRows = gpSheet.data.values || [];
    const textRows = textSheet.data.values || [];
    const homeRows = homeSheet.data.values || [];

    if (gpRows.length === 0) {
      return res.status(404).json({ message: "Sheet GP không có dữ liệu" });
    }

    // 🟢 Chuẩn bị dữ liệu header + body
    const header = gpRows[0];
    const gpData = gpRows.slice(1);
    const textData = textRows.slice(1);
    const homeData = homeRows.slice(1);

    // 🟢 Xử lý input (tách nhiều site/mã)
    const keywords = keyword.split(/[\n,\s]+/).map(k => k.trim().toLowerCase()).filter(k => k);

    // 🟢 Lọc dữ liệu trong GP
    const results = gpData.filter(row => {
      const site = (row[4] || "").toLowerCase();
      const code = (row[16] || "").toLowerCase();
      return keywords.some(k => site.includes(k) || code.includes(k));
    });

    if (results.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy" });
    }

    // 🟢 Trả về cả 3 sheet để FE xử lý
    res.status(200).json({
      header,
      results,
      textData,
      homeData,
    });
  } catch (error) {
    console.error("🔥 Lỗi Google Sheets API:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}
