import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { site } = req.query;

    if (!site) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    // 1️⃣ Tách input thành nhiều từ (cách nhau bởi khoảng trắng hoặc xuống dòng)
    const keywords = site
      .split(/\s+|\n+/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k);

    // 2️⃣ Kết nối Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ✅ LẤY DỮ LIỆU ĐÚNG SHEET "NCC MIU SEO"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "NCC MIU SEO!A2:Q", // ✅ chính xác tên sheet + range
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu trong Google Sheet" });
    }

    // 3️⃣ Lọc dữ liệu theo Site (E), Mã (Q) hoặc Tên (P)
    const found = rows.filter((row) => {
      const siteCell = (row[4] || "").toLowerCase();  // Cột Site
      const tenCell  = (row[15] || "").toLowerCase(); // Cột Tên
      const maCell   = (row[16] || "").toLowerCase(); // Cột Mã

      return keywords.some(
        (kw) =>
          siteCell.includes(kw) ||
          tenCell.includes(kw) ||
          maCell.includes(kw)
      );
    });

    // 4️⃣ Trả kết quả JSON cho frontend
    if (found.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy site/mã/tên nào" });
    }

    return res.status(200).json(found);
  } catch (error) {
    console.error("🔥 Lỗi Google Sheets API:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}
