import { useEffect, useMemo, useRef, useState } from "react";

/** === CONFIG: CHỈ SỐ CÁC CỘT QUAN TRỌNG (nếu header đổi thứ tự, chỉnh 2 số này) === */
const SITE_COL = 4;      // cột "Site"
const STATUS_COL = 1;    // cột "Tình Trạng"

/** Chuẩn hoá domain để so khớp fuzzy */
function norm(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}

export default function Home() {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState([]);         // mảng tiêu đề cột
  const [gp, setGp] = useState([]);                 // dữ liệu GP (mảng các hàng)
  const [textData, setTextData] = useState([]);     // dữ liệu TEXT
  const [homeData, setHomeData] = useState([]);     // dữ liệu HOME
  const [active, setActive] = useState("GP");       // "GP" | "TEXT" | "HOME"
  const [error, setError] = useState("");

  /** --- Excel-like selection state --- */
  const [anchor, setAnchor] = useState(null);       // {r,c} điểm neo
  const [end, setEnd] = useState(null);             // {r,c} điểm cuối (khi kéo/Shift)
  const [isDragging, setIsDragging] = useState(false);
  const tableRef = useRef(null);

  // range được chọn (nếu có)
  const selectedRange = useMemo(() => {
    if (!anchor || !end) return null;
    const r1 = Math.min(anchor.r, end.r);
    const c1 = Math.min(anchor.c, end.c);
    const r2 = Math.max(anchor.r, end.r);
    const c2 = Math.max(anchor.c, end.c);
    return { r1, c1, r2, c2 };
  }, [anchor, end]);

  // dữ liệu sheet hiện tại
  const rawSheet = active === "GP" ? gp : active === "TEXT" ? textData : homeData;

  // map theo domain chuẩn hoá => row
  const sheetMap = useMemo(() => {
    const m = new Map();
    rawSheet.forEach((row) => {
      const site = row[SITE_COL];
      const key = norm(site);
      if (key) m.set(key, row);
    });
    return m;
  }, [rawSheet]);

  /** build rows hiển thị:
   * - Dùng sheet đang chọn
   * - Với TEXT/HOME: giữ nguyên (không map lại giá)
   * - Append các domain không có dữ liệu ở cuối: "Không có dữ liệu"
   */
  const rows = useMemo(() => {
    // danh sách domain nhập theo thứ tự
    const inputs = input
      .split(/[\n,]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    // 1) Lấy dữ liệu có trong DB theo thứ tự inputs (nếu nhập rỗng => trả full sheet)
    let haveRows = [];
    if (inputs.length === 0) {
      haveRows = [...rawSheet];
    } else {
      haveRows = inputs
        .map((s) => {
          const k = norm(s);
          // match: chứa hoặc bằng
          const exact = sheetMap.get(k);
          if (exact) return exact;
          // contains: duyệt map (ít domain => OK)
          for (const [key, r] of sheetMap.entries()) {
            if (key.includes(k) || k.includes(key)) return r;
          }
          return null;
        })
        .filter(Boolean);
    }

    // 2) Build set đã có
    const haveSet = new Set(haveRows.map((r) => norm(r[SITE_COL])));

    // 3) Tìm các domain không có
    const missing = inputs
      .map(norm)
      .filter(Boolean)
      .filter((k) => !haveSet.has(k));

    // 4) Append hàng "Không có dữ liệu"
    const appended = [...haveRows];
    missing.forEach((k) => {
      const siteText = k;
      const row = new Array(Math.max(header.length, 18)).fill("");
      row[STATUS_COL] = "Không có dữ liệu";
      row[SITE_COL] = siteText;
      appended.push(row);
    });

    return appended;
  }, [input, rawSheet, sheetMap, header]);

  /** FETCH */
  const handleSearch = async () => {
    setError("");
    try {
      const res = await fetch(`/api/check?keyword=${encodeURIComponent(input)}`);
      const json = await res.json();
      if (!json || !json.results) {
        setError(json?.message || "Không tìm thấy");
        setHeader([]);
        setGp([]);
        setTextData([]);
        setHomeData([]);
        return;
      }
      setHeader(json.header || []);
      setGp(json.results || []);
      setTextData(json.textData || []);
      setHomeData(json.homeData || []);
    } catch (e) {
      setError("Lỗi server");
    }
  };

  /** === Excel-like copy: Ctrl/Cmd + C === */
  useEffect(() => {
    function onKey(e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() !== "c") return;

      // nếu có vùng chọn => copy vùng chọn
      if (selectedRange && rows.length) {
        e.preventDefault();
        const { r1, c1, r2, c2 } = selectedRange;
        const parts = [];
        for (let r = r1; r <= r2; r++) {
          const row = rows[r] || [];
          const line = [];
          for (let c = c1; c <= c2; c++) {
            let cell = row[c] ?? "";
            // bỏ HTML trong ô (nếu có)
            if (typeof cell === "string") {
              cell = cell.replace(/<[^>]+>/g, "");
            }
            line.push(String(cell));
          }
          parts.push(line.join("\t"));
        }
        const text = parts.join("\n");
        navigator.clipboard.writeText(text);
        return;
      }
      // nếu không có vùng chọn mà đang focus ở table: cho phép copy browser default
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedRange, rows]);

  /** Mouse handlers cho selection */
  const handleMouseDown = (r, c) => {
    setAnchor({ r, c });
    setEnd({ r, c });
    setIsDragging(true);
  };
  const handleMouseEnter = (r, c) => {
    if (!isDragging) return;
    setEnd({ r, c });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Shift-click: mở rộng từ anchor
  const handleCellClick = (e, r, c) => {
    if (e.shiftKey && anchor) {
      setEnd({ r, c });
    } else {
      setAnchor({ r, c });
      setEnd({ r, c });
    }
  };

  // copy nhanh 1 ô
  const copyCell = (text) => {
    const t = String(text ?? "").replace(/<[^>]+>/g, "");
    if (!t) return;
    navigator.clipboard.writeText(t);
  };

  /** Ghi chú thu gọn */
  const renderNote = (val) => {
    const [open, setOpen] = useState(false);
    if (!val) return "";
    const short = String(val).slice(0, 80);
    return (
      <span style={{ whiteSpace: "nowrap" }}>
        {open ? String(val) : short}
        {String(val).length > 80 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((s) => !s);
            }}
            style={{
              marginLeft: 6,
              border: "none",
              background: "transparent",
              color: "#0b5ed7",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {open ? "Thu gọn" : "[Xem thêm]"}
          </button>
        )}
      </span>
    );
  };

  /** render cell với selection highlight */
  const isSelected = (r, c) => {
    if (!selectedRange) return false;
    const { r1, c1, r2, c2 } = selectedRange;
    return r >= r1 && r <= r2 && c >= c1 && c <= c2;
  };

  return (
    <div style={{ padding: 20, fontFamily: "Inter, Arial, sans-serif" }}>
      <h2>Tool Check Site (Demo)</h2>

      <textarea
        rows={8}
        style={{ width: 700, maxWidth: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        placeholder="Nhập site hoặc mã (mỗi dòng 1 giá trị)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={handleSearch}
          style={{
            padding: "9px 18px",
            background: "#2E8B57",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🔎 Tìm kiếm
        </button>

        {["GP", "TEXT", "HOME"].map((k) => (
          <button
            key={k}
            onClick={() => {
              setActive(k);
              // reset selection khi đổi sheet
              setAnchor(null);
              setEnd(null);
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: active === k ? "#0d6efd" : "#fff",
              color: active === k ? "#fff" : "#333",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {k}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      {rows.length > 0 && (
        <>
          <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
            💡 Mẹo: Kéo chuột để quét vùng ⇒ nhấn <b>Ctrl/Cmd + C</b> để copy. Double-click để copy 1 ô.
          </div>

          <div
            ref={tableRef}
            onMouseLeave={() => setIsDragging(false)}
            onMouseUp={handleMouseUp}
            style={{
              marginTop: 10,
              overflow: "auto",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <table style={{ borderCollapse: "collapse", width: "100%", background: "#fff" }}>
              <thead>
                <tr>
                  {header.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "#f8fafc",
                        borderBottom: "1px solid #e5e7eb",
                        padding: "10px 8px",
                        fontWeight: 700,
                        textAlign: "center",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, r) => (
                  <tr key={r} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {row.map((cell, c) => {
                      const sel = isSelected(r, c);
                      const isNoteCol = header[c]?.toLowerCase().includes("ghi chú");
                      const value = isNoteCol ? renderNote(cell) : cell;

                      const isNoData = row[STATUS_COL] === "Không có dữ liệu";
                      return (
                        <td
                          key={c}
                          onMouseDown={() => handleMouseDown(r, c)}
                          onMouseEnter={() => handleMouseEnter(r, c)}
                          onClick={(e) => handleCellClick(e, r, c)}
                          onDoubleClick={() => copyCell(cell)}
                          style={{
                            padding: "8px 10px",
                            textAlign: "center",
                            cursor: "cell",
                            userSelect: "none",
                            background: sel ? "#cfe8ff" : isNoData ? "#f6f7f9" : "transparent",
                            color: isNoData ? "#8a8f98" : "#111827",
                            borderLeft: "1px solid #f1f5f9",
                            borderRight: "1px solid #f1f5f9",
                            whiteSpace: "nowrap",
                          }}
                          title={typeof cell === "string" ? cell.replace(/<[^>]+>/g, "") : ""}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
