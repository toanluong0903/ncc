export default function handler(req, res) {
  const { site } = req.query;

  // Dữ liệu test mẫu
  const demoData = {
    "licham.vn": {
      TinhTrang: "Ngưng",
      ChuDe: "Đời sống",
      DR: 29,
      Traffic: 81383,
      GiaBan: "Ngưng gp"
    }
  };

  const result = demoData[site];

  if (!result) {
    res.status(404).json({ message: "Không tìm thấy site" });
  } else {
    res.status(200).json(result);
  }
}