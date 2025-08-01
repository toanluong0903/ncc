// pages/api/check.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { search, mode } = req.body; // mode = GP | TEXT | HOME

    if (!search) return res.status(400).json({ error: 'Thiếu từ khóa tìm kiếm' });

    // Google Auth
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // 🔹 Lấy dữ liệu GP (toàn bộ bảng)
    const gpSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `GP!A1:Q1000`,
    });

    let rows = gpSheet.data.values || [];

    // Bỏ header
    const header = rows[0];
    rows = rows.slice(1);

    // 🔍 Lọc site hoặc mã (cột E hoặc Q)
    let result = rows.filter(row =>
      (row[4] && row[4].toLowerCase().includes(search.toLowerCase())) ||
      (row[16] && row[16].toLowerCase().includes(search.toLowerCase()))
    );

    // 🔹 Nếu user chọn TEXT hoặc HOME => ghi đè 2 cột Giá Bán & Giá Mua
    if (mode !== 'GP') {
      const priceSheet = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: `${mode}!J2:K1000`, // chỉ lấy 2 cột từ dòng 2 (bỏ header)
      });

      const priceRows = priceSheet.data.values || [];

      // Ghi đè Giá Bán (cột 10) và Giá Mua (cột 11)
      result = result.map((row, index) => {
        if (priceRows[index]) {
          row[9] = priceRows[index][0] || row[9];
          row[10] = priceRows[index][1] || row[10];
        }
        return row;
      });
    }

    return res.status(200).json({ header, result });
  } catch (err) {
    console.error('❌ Lỗi API:', err);
    return res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
}
