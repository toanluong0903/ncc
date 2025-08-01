import { google } from "googleapis";

export default async function handler(req, res) {
  const { query } = req;
  const search = (query.site || "").trim(); // nhận dữ liệu từ ô nhập (có thể là site hoặc mã)

  if (!search) {
    return res.status(400).json({ message: "Vui lòng nhập site hoặc mã" });
  }

  try {
    // Lấy credentials từ biến môi trường Vercel
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const sheetId = process.env.SHEET_ID;

    // Tạo Google API client
    const client = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    // Kết nối Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: client });

    // Đọc dữ liệu từ Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A:Q", // Đọc tất cả các cột từ A -> Q
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Không có dữ liệu" });
    }

    const headers = rows[0];
    const siteIndex = headers.indexOf("Site");
    const maIndex = headers.indexOf("Mã");

    // Tìm site (trả về 1 dòng)
    const siteRow = rows.find((row) => row[siteIndex] === search);

    // Tìm theo mã (trả về nhiều dòng)
    const maRows = rows.filter((row) => row[maIndex] === search);

    if (siteRow) {
      const result = {};
      headers.forEach((header, i) => {
        result[header] = siteRow[i] || "";
      });
      return res.status(200).json({ type: "site", data: result });
    }

    if (maRows.length > 0) {
      const results = maRows.map((row) => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || "";
        });
        return obj;
      });
      return res.status(200).json({ type: "ma", data: results });
    }

    res.status(404).json({ message: "Không tìm thấy site hoặc mã" });
  } catch (error) {
    console.error("Lỗi Google API:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}
