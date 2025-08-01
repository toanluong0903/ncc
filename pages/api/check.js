import { google } from "googleapis";

export default async function handler(req, res) {
  const { site } = req.query;

  if (!site) {
    return res.status(400).json({ message: "Thiếu tham số ?site=" });
  }

  try {
    // ✅ Load service account từ biến môi trường
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ✅ Lấy dữ liệu từ Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "A1:Q10000", // lấy hết dữ liệu (có thể tăng nếu sheet lớn)
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    // ✅ Lấy header (hàng đầu tiên)
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // ✅ Tìm theo “Site” hoặc “Mã”
    const bySite = dataRows.find((r) => r[4] && r[4].toLowerCase() === site.toLowerCase());
    const byMa = dataRows.filter((r) => r[16] && r[16].toLowerCase() === site.toLowerCase());

    if (bySite) {
      // Nếu tìm thấy site -> trả về 1 object
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = bySite[idx] || "";
      });

      return res.status(200).json({ type: "site", data: obj });
    } else if (byMa.length > 0) {
      // Nếu tìm thấy mã -> trả về nhiều dòng
      const arr = byMa.map((row) => {
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx] || "";
        });
        return obj;
      });

      return res.status(200).json({ type: "ma", headers, data: arr });
    } else {
      return res.status(404).json({ message: "Không tìm thấy site hoặc mã" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
}
