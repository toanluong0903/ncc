import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.SHEET_ID;
    const range = "Sheet1!A2:Q";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    const query = (req.query.site || "").toLowerCase();
    const results = rows.filter(
      (row) =>
        (row[4] && row[4].toLowerCase().includes(query)) || // cột Site
        (row[16] && row[16].toLowerCase().includes(query))   // cột Mã
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy site" });
    }

    return res.status(200).json({ results });
  } catch (err) {
    console.error("🔥 Lỗi Google Sheets API:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
}
