// pages/api/check.js
import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { site } = req.query; // user nhập ô tìm kiếm
    if (!site) return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });

    // 🟢 Load key từ biến môi trường Vercel
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const sheetId = process.env.SHEET_ID;

    // 🟢 Tạo Google Sheets API client
    const client = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth: client });

    // 🟢 Lấy toàn bộ dữ liệu từ Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A1:Q", // quét hết các cột từ CS -> Mã
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Sheet không có dữ liệu" });
    }

    // 🟢 Chuẩn hóa input: tách nhiều dòng hoặc cách nhau bởi dấu xuống dòng, dấu phẩy, khoảng trắng
    const searchTerms = site
      .split(/[\n,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s);

    // 🟢 Lấy header (A1:Q1) & data
    const header = rows[0];
    const data = rows.slice(1);

    // 🟢 Filter data: tìm theo site (E) hoặc mã (Q)
    const results = data.filter((row) => {
      const siteCol = row[4] ? row[4].toLowerCase() : ""; // cột E
      const codeCol = row[16] ? row[16].toLowerCase() : ""; // cột Q
      return searchTerms.some(
        (term) => siteCol === term || codeCol === term
      );
    });

    // 🟢 Trả về JSON
    if (results.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy site hoặc mã" });
    }

    // Convert thành object có key header: value
    const formatted = results.map((row) => {
      let obj = {};
      header.forEach((col, idx) => {
        obj[col] = row[idx] || ""; // nếu cột trống thì trả ""
      });
      return obj;
    });

    return res.status(200).json({ data: formatted });
  } catch (err) {
    console.error("Lỗi server:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
}
