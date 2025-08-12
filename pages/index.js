// pages/index.js
import { useState, useMemo } from "react";

/**
 * ✅ Bản full 1 file:
 * - Cho phép bôi chọn & Ctrl/Cmd+C như site đối thủ (KHÔNG chặn selection)
 * - Ghi chú thu gọn, bấm [Xem thêm]/[Thu gọn]
 * - 3 nút GP / TEXT / HOME: chỉ thay Giá Bán & Giá Mua từ sheet tương ứng
 * - Không dùng custom “multi-select” nữa để việc copy theo trình duyệt là tự nhiên nhất
 */

function NoteCell({ text = "" }) {
  const [open, setOpen] = useState(false);
  const isLong = text && text.length > 120;
  const shown = isLong && !open ? text.slice(0, 120) + "…" : text;

  if (!text) return null;

  return (
    <div className={`note-cell ${open ? "expanded" : ""}`}>
      {shown}
      {isLong && (
        <button
          className="note-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          type="button"
        >
          {open ? "[Thu gọn]" : "[Xem thêm]"}
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState([]);
  const [data, setData] = useState([]);
  const [textData, setTextData] = useState([]);
  const [homeData, setHomeData] = useState([]);
  const [activeSheet, setActiveSheet] = useState("GP"); // GP | TEXT | HOME
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSearch() {
    setErr("");
    setLoading(true);
    try {
      const qs = encodeURIComponent(input.trim());
      const res = await fetch(`/api/check?keyword=${qs}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || "Lỗi tải dữ liệu");

      // backend trả: { header, results, textData, homeData }
      setHeader(json.header || []);
      setData(json.results || []);
      setTextData(json.textData || []);
      setHomeData(json.homeData || []);
    } catch (e) {
      setErr(e.message || "Lỗi server");
    } finally {
      setLoading(false);
    }
  }

  // map sheet phụ theo Site để lấy giá nhanh
  const mapText = useMemo(() => {
    const m = new Map();
    for (const r of textData || []) {
      // site ở cột 4 (index 4) theo format cũ
      m.set(String(r[4] || "").trim(), r);
    }
    return m;
  }, [textData]);

  const mapHome = useMemo(() => {
    const m = new Map();
    for (const r of homeData || []) {
      m.set(String(r[4] || "").trim(), r);
    }
    return m;
  }, [homeData]);

  // Trộn giá theo sheet đang chọn
  const displayRows = useMemo(() => {
    if (activeSheet === "GP") return data;

    const sourceMap = activeSheet === "TEXT" ? mapText : mapHome;
    return (data || []).map((row) => {
      const site = String(row[4] || "").trim();
      const matched = sourceMap.get(site);
      if (!matched) return row;
      const clone = [...row];
      // cột 9: Giá Bán, cột 10: Giá Mua (theo format cũ bạn đang dùng)
      clone[9] = matched[9] ?? clone[9];
      clone[10] = matched[10] ?? clone[10];
      return clone;
    });
  }, [data, activeSheet, mapText, mapHome]);

  return (
    <div className="page">
      <h2>Tool Check Site (Demo)</h2>

      <textarea
        rows={4}
        className="input"
        placeholder="Nhập site hoặc mã (mỗi dòng 1 giá trị)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="actions">
        <button className="btn primary" onClick={handleSearch} disabled={loading}>
          {loading ? "Đang tìm..." : "🔍 Tìm kiếm"}
        </button>

        {!!data.length && (
          <div className="sheet-switch">
            <button
              className={`tab ${activeSheet === "GP" ? "active" : ""}`}
              onClick={() => setActiveSheet("GP")}
              type="button"
            >
              GP
            </button>
            <button
              className={`tab ${activeSheet === "TEXT" ? "active" : ""}`}
              onClick={() => setActiveSheet("TEXT")}
              type="button"
            >
              TEXT
            </button>
            <button
              className={`tab ${activeSheet === "HOME" ? "active" : ""}`}
              onClick={() => setActiveSheet("HOME")}
              type="button"
            >
              HOME
            </button>
          </div>
        )}
      </div>

      {err && <div className="error">⚠️ {err}</div>}

      {!!displayRows.length && (
        <div className="results-wrap">
          <table className="table">
            <thead>
              <tr>
                {header.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => {
                    const isNote =
                      (header[cIdx] || "").toLowerCase().includes("ghi chú") ||
                      (header[cIdx] || "").toLowerCase().includes("ghi chu");
                    return (
                      <td key={cIdx}>
                        {isNote ? <NoteCell text={String(cell ?? "")} /> : String(cell ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="hint">
            💡 Mẹo: Kéo bôi ô bất kỳ rồi <b>Ctrl/Cmd + C</b> để copy, dán thẳng vào Excel/Sheets.
          </p>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          background: #fafafa;
        }
        h2 {
          margin: 0 0 12px;
        }
        .input {
          width: 100%;
          max-width: 760px;
          border: 1px solid #dcdcdc;
          border-radius: 8px;
          padding: 10px 12px;
          background: #fff;
          font-size: 14px;
          outline: none;
        }
        .input:focus {
          border-color: #4096ff;
          box-shadow: 0 0 0 3px rgba(64, 150, 255, 0.15);
        }
        .actions {
          margin: 10px 0 6px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn {
          border: 1px solid #dcdcdc;
          background: #fff;
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn.primary {
          background: #2e8b57;
          border-color: #2e8b57;
          color: #fff;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .sheet-switch {
          display: inline-flex;
          gap: 8px;
          margin-left: 6px;
        }
        .sheet-switch .tab {
          border: 1px solid #dcdcdc;
          background: #fff;
          border-radius: 6px;
          height: 32px;
          padding: 0 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .sheet-switch .tab.active {
          background: #175fe6;
          color: #fff;
          border-color: #175fe6;
        }
        .error {
          margin-top: 6px;
          color: #c62828;
          font-weight: 600;
        }
        .results-wrap {
          margin-top: 14px;
          background: #fff;
          border: 1px solid #e9e9e9;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        thead th {
          position: sticky;
          top: 0;
          z-index: 1;
          background: #f7f9fc;
          text-align: left;
          font-weight: 700;
          border-bottom: 1px solid #ececec;
          padding: 10px;
          white-space: nowrap;
        }
        tbody td {
          border-bottom: 1px solid #f3f3f3;
          padding: 8px 10px;
          vertical-align: top;
          background: #fff;
        }

        /* ✅ CHO PHÉP CHỌN & COPY TRÊN BẢNG */
        .results-wrap,
        .results-wrap table,
        .results-wrap td,
        .results-wrap th {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
          cursor: text;
        }
        /* Không cần chọn chữ ở nút */
        .note-toggle {
          user-select: none !important;
          cursor: pointer;
          border: none;
          background: none;
          color: #175fe6;
          margin-left: 6px;
          padding: 0;
        }

        /* Ghi chú thu gọn / mở rộng */
        .note-cell {
          max-width: 520px; /* chỉnh theo UI */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4;
        }
        .note-cell.expanded {
          white-space: normal;
          overflow: visible;
        }

        .hint {
          margin: 10px;
          color: #6b7280;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
