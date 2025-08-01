import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { keyword } = req.body;

    // ✅ Nếu không có input → báo lỗi
    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ error: "Thiếu từ khóa tìm kiếm" });
    }

    // ✅ Tách keyword nếu nhập nhiều (phân cách bằng dấu cách, dấu phẩy hoặc xuống dòng)
    const keywords = keyword.split(/[\s,\n]+/).map(k => k.trim().toLowerCase());

    // ✅ Setup Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "NCC MIU SEO!A1:Q",  // ✅ Đúng tên sheet bạn đang dùng
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy dữ liệu trong sheet" });
    }

    // ✅ Lọc kết quả nếu cột Site (E) hoặc cột Mã (Q) có chứa keyword
    const results = rows.filter((row) => {
      const site = (row[4] || "").toLowerCase();
      const code = (row[16] || "").toLowerCase();
      return keywords.some(k => site.includes(k) || code.includes(k));
    });

    // ✅ Nếu không tìm thấy site hoặc mã
    if (results.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy kết quả" });
    }

    // ✅ Trả về tất cả kết quả dạng JSON
    return res.status(200).json({ data: results });

  } catch (error) {
    console.error("❌ Lỗi server:", error);
    return res.status(500).json({ error: "Lỗi server", details: error.message });
  }
}
