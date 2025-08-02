import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    // ✅ Kết nối Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID;

    // ✅ Load cả 3 sheet GP, TEXT, HOME
    const sheetNames = ["GP", "TEXT", "HOME"];
    const allData = {};

    for (const name of sheetNames) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${name}!A:Q`, // Lấy hết từ cột A đến Q
      });
      allData[name] = response.data.values || [];
    }

    // ✅ Lấy header từ sheet GP
    const header = allData["GP"][0];
    const gpRows = allData["GP"].slice(1);
    const textRows = allData["TEXT"].slice(1);
    const homeRows = allData["HOME"].slice(1);

    // ✅ Chuẩn hóa input (nhiều giá trị)
    const keywords = keyword
      .split(/\n|,/)
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k);

    // ✅ Lọc dữ liệu theo site (cột 5) hoặc mã (cột 17) trong sheet GP
    const results = gpRows.filter((row) => {
      const site = row[4]?.toLowerCase() || "";
      const code = row[16]?.toLowerCase() || "";
      return keywords.some((kw) => site === kw || code === kw);
    });

    if (results.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy" });
    }

    return res.status(200).json({
      header,
      results,
      textData: textRows,
      homeData: homeRows,
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}
