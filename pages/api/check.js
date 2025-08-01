import { google } from "googleapis";

export default async function handler(req, res) {
  const { site } = req.query;

  if (!site) {
    return res.status(400).json({ message: "Thiếu tham số ?site=" });
  }

  try {
    // ✅ Auth service account (dùng file JSON đã add vào Vercel ENV)
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ✅ Lấy dữ liệu Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "A1:Q10000", // range rộng để lấy hết
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    const headers = rows[0]; // hàng tiêu đề
    const dataRows = rows.slice(1);

    // ✅ Tìm theo site hoặc mã
    const foundBySite = dataRows.find((r) => r[4] && r[4].toLowerCase() === site.toLowerCase());
    const foundByMa = dataRows.filter((r) => r[16] && r[16].toLowerCase() === site.toLowerCase());

    if (foundBySite) {
      // ✅ Nếu tìm thấy site -> trả về 1 dòng
      const obj = {};
      headers.forEach((h, i) => obj[h] = foundBySite[i] || "");
      return res.status(200).json({ type: "site", data: obj });
    } else if (foundByMa.length > 0) {
      // ✅ Nếu tìm theo mã -> trả về tất cả dòng khớp
      const list = foundByMa.map((row) => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i] || "");
        return obj;
      });
      return res.status(200).json({ type: "ma", data: list });
    } else {
      return res.status(404).json({ message: "Không tìm thấy site hoặc mã" });
    }
  } catch (err) {
    console.error("Lỗi Google Sheets:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
}
