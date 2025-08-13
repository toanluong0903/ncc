// pages/index.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** ======= Cấu trúc cột trả về (0-based) =======
 * 0: CS | 1: Tình Trạng | 2: Bóng | 3: BET | 4: Site
 * 5: Chủ đề | 6: DR | 7: Traffic | 8: Ghi Chú
 * 9: Giá Bán | 10: Giá Mua | 11: HH | 12: Giá Cuối
 * 13: LN | 14: Time | 15: Tên | 16: Mã
 */
const COL = {
  STATUS: 1,
  SITE: 4,
  NOTE: 8,
  SELL: 9,
  BUY: 10,
};

// === Helpers: normalize & fuzzy-contains ===
const normalize = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

const containsSite = (haystack, needle) =>
  normalize(haystack).includes(normalize(needle));

export default function Home() {
  const [input, setInput] = useState("");
  const [activeSheet, setActiveSheet] = useState("GP"); // GP | TEXT | HOME

  const [header, setHeader] = useState([]);
  const [gpRows, setGpRows] = useState([]); // rows (array of array)
  const [textRows, setTextRows] = useState([]);
  const [homeRows, setHomeRows] = useState([]);
  const [error, setError] = useState("");

  // Collapse/Expand NOTE theo index hàng
  const [noteOpen, setNoteOpen] = useState(() => new Set());
  const toggleNote = useCallback((rowIdx) => {
    setNoteOpen((s) => {
      const ns = new Set(s);
      ns.has(rowIdx) ? ns.delete(rowIdx) : ns.add(rowIdx);
      return ns;
    });
  }, []);

  // ===== Selection nâng cao (giống đối thủ) =====
  const tableRef = useRef(null);

  // “Neo” để Shift chọn vùng
  const [anchor, setAnchor] = useState(null); // {r,c} hoặc null
  // Tập ô đã chọn (rời rạc) – dùng Set("r,c")
  const [selected, setSelected] = useState(new Set());
  // Trạng thái kéo chuột
  const dragModeRef = useRef({ dragging: false, add: false }); // add = ctrl/meta để cộng dồn

  // Tạo key cho ô
  const keyOf = (r, c) => `${r},${c}`;
  const parseKey = (k) => k.split(",").map((n) => parseInt(n, 10));

  // Lấy vùng hình chữ nhật giữa (r1,c1) -> (r2,c2)
  const rectCells = (r1, c1, r2, c2) => {
    const out = [];
    const rr1 = Math.min(r1, r2);
    const rr2 = Math.max(r1, r2);
    const cc1 = Math.min(c1, c2);
    const cc2 = Math.max(c1, c2);
    for (let r = rr1; r <= rr2; r++) {
      for (let c = cc1; c <= cc2; c++) {
        out.push(keyOf(r, c));
      }
    }
    return out;
  };

  // Thêm/bỏ chọn 1 ô
  const toggleCell = (r, c) => {
    setSelected((s) => {
      const ns = new Set(s);
      const k = keyOf(r, c);
      ns.has(k) ? ns.delete(k) : ns.add(k);
      return ns;
    });
  };

  // Chọn 1 vùng (replace hay add)
  const applyRect = (r1, c1, r2, c2, add = false) => {
    const ks = rectCells(r1, c1, r2, c2);
    setSelected((s) => {
      if (add) {
        const ns = new Set(s);
        ks.forEach((k) => ns.add(k));
        return ns;
      }
      return new Set(ks);
    });
  };

  // Click/Drag chọn
  const onCellMouseDown = (e, r, c) => {
    const add = e.ctrlKey || e.metaKey;
    dragModeRef.current = { dragging: true, add };
    setAnchor({ r, c });

    if (add) {
      // Ctrl/⌘ + click: toggle ô
      toggleCell(r, c);
    } else if (e.shiftKey && anchor) {
      // Shift + click: vùng từ neo -> (r,c). Nếu có Ctrl/⌘ + Shift thì add
      applyRect(anchor.r, anchor.c, r, c, add);
    } else {
      // click thường: replace bằng 1 ô
      setSelected(new Set([keyOf(r, c)]));
    }
  };

  const onCellMouseEnter = (e, r, c) => {
    if (!dragModeRef.current.dragging || !anchor) return;
    // đang kéo: cứ vẽ vùng (add hoặc replace tuỳ ctrl/meta)
    applyRect(anchor.r, anchor.c, r, c, dragModeRef.current.add);
  };

  const onMouseUpGlobal = () => {
    dragModeRef.current.dragging = false;
  };

  // Keyboard hỗ trợ
  useEffect(() => {
    const onKey = (e) => {
      // Esc xoá selection
      if (e.key === "Escape") {
        setSelected(new Set());
        setAnchor(null);
        return;
      }

      // Copy nếu có selection
      const isCopy = (e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C");
      if (!isCopy || selected.size === 0) return;

      // Chuẩn TSV từ selected (theo thứ tự hàng/ cột tăng dần)
      const byRow = new Map(); // r -> Set(cols)
      let minR = Infinity,
        maxR = -Infinity;
      for (const k of selected) {
        const [r, c] = parseKey(k);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        if (!byRow.has(r)) byRow.set(r, new Set());
        byRow.get(r).add(c);
      }
      const lines = [];
      for (let r = minR; r <= maxR; r++) {
        const cols = [...(byRow.get(r) || [])].sort((a, b) => a - b);
        const vals = cols.map((c) => currentRows[r]?.[c] ?? "");
        lines.push(vals.join("\t"));
      }
      const text = lines.join("\n");
      navigator.clipboard.writeText(text);

      // feedback nhẹ
      if (tableRef.current) {
        tableRef.current.style.boxShadow = "0 0 0 2px #3b82f6 inset";
        setTimeout(() => {
          if (tableRef.current) tableRef.current.style.boxShadow = "none";
        }, 200);
      }
    };

    const onUp = () => onMouseUpGlobal();
    document.addEventListener("keydown", onKey);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mouseup", onUp);
    };
  }, [selected]); // eslint-disable-line

  // Double click: copy 1 ô
  const handleDoubleClickCopy = (val) => {
    navigator.clipboard.writeText(String(val ?? ""));
  };

  // ===== Map TEXT/HOME sang GP theo fuzzy site =====
  const currentRows = useMemo(() => {
    let out = gpRows.map((r) => [...r]);

    if (activeSheet === "TEXT" || activeSheet === "HOME") {
      const override = activeSheet === "TEXT" ? textRows : homeRows;
      const priceMap = new Map(); // normSite -> {sell, buy}

      for (const row of override) {
        const s = row[COL.SITE];
        if (!s) continue;
        priceMap.set(normalize(s), {
          sell: row[COL.SELL] ?? "",
          buy: row[COL.BUY] ?? "",
        });
      }

      out = out.map((row) => {
        const site = normalize(row[COL.SITE] || "");
        for (const [k, price] of priceMap) {
          if (site.includes(k)) {
            row[COL.SELL] = price.sell ?? "";
            row[COL.BUY] = price.buy ?? "";
            break;
          }
        }
        return row;
      });
    }
    return out;
  }, [gpRows, textRows, homeRows, activeSheet]);

  // ===== Tìm kiếm =====
  const handleSearch = async () => {
    setError("");
    setSelected(new Set());
    setAnchor(null);
    setNoteOpen(new Set());

    try {
      const res = await fetch(`/api/check?keyword=${encodeURIComponent(input)}`);
      const json = await res.json();

      if (!json || (!json.results && !json.header)) {
        setError(json?.message || "Lỗi dữ liệu.");
        return;
      }

      const _header = json.header || [];
      const _gp = Array.isArray(json.results) ? json.results : [];
      const _text = Array.isArray(json.textData) ? json.textData : [];
      const _home = Array.isArray(json.homeData) ? json.homeData : [];

      // domain người dùng nhập
      const wanted = Array.from(
        new Set(
          input
            .split(/\r?\n|,/)
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );

      // những site có trong GP
      const seen = new Set();
      _gp.forEach((row) => {
        const s = row[COL.SITE];
        if (s) seen.add(normalize(s));
      });

      // thiếu -> đẩy xuống cuối, Tình Trạng = "Không có dữ liệu"
      const missingRows = [];
      for (const site of wanted) {
        const normQ = normalize(site);
        const has = [...seen].some((s) => s.includes(normQ) || normQ.includes(s));
        if (!has) {
          const blank = Array(_header.length).fill("");
          blank[COL.STATUS] = "Không có dữ liệu";
          blank[COL.SITE] = site;
          missingRows.push(blank);
        }
      }

      setHeader(_header);
      setGpRows([..._gp, ...missingRows]);
      setTextRows(_text);
      setHomeRows(_home);
    } catch (e) {
      setError("Lỗi server.");
    }
  };

  // ======= UI =======
  const isCellSelected = useCallback(
    (r, c) => selected.has(keyOf(r, c)),
    [selected]
  );

  return (
    <div
      style={{
        padding: 20,
        minHeight: "100vh",
        background: "#fafafa",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <h2 style={{ marginBottom: 12 }}>Tool Check Site (Demo)</h2>

      <textarea
        rows={10}
        style={{
          width: 700,
          maxWidth: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ddd",
          outline: "none",
          background: "#fff",
        }}
        placeholder="Nhập site hoặc mã (mỗi dòng 1 giá trị, hoặc phân tách bằng dấu phẩy)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button
          onClick={handleSearch}
          style={{
            padding: "10px 22px",
            background: "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🔍 Tìm kiếm
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginTop: 10, fontWeight: 600 }}>{error}</div>
      )}

      {/* Tabs GP/TEXT/HOME */}
      {currentRows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {["GP", "TEXT", "HOME"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveSheet(t)}
              style={{
                marginRight: 10,
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #ddd",
                background: activeSheet === t ? "#eef2ff" : "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Hint copy */}
      {currentRows.length > 0 && (
        <div style={{ marginTop: 12, color: "#555", lineHeight: 1.5 }}>
          💡 Chọn ô như Excel:
          <ul style={{ margin: "6px 0 0 18px" }}>
            <li>Kéo bôi 1 vùng rồi bấm <b>Ctrl/Cmd + C</b> để copy.</li>
            <li><b>Ctrl/Cmd + click</b> để chọn nhiều ô rời rạc.</li>
            <li><b>Shift + click</b> để chọn vùng từ ô neo tới ô hiện tại.</li>
            <li><b>Double-click</b> 1 ô để copy nhanh ô đó. Nhấn <b>Esc</b> để bỏ chọn.</li>
          </ul>
        </div>
      )}

      {/* Table */}
      {currentRows.length > 0 && (
        <div
          ref={tableRef}
          style={{
            marginTop: 16,
            overflowX: "auto",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                {header.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#f8fafc",
                      borderBottom: "2px solid #e5e7eb",
                      padding: "10px 8px",
                      textAlign: "left",
                      fontWeight: 700,
                      color: "#374151",
                      whiteSpace: "nowrap",
                      zIndex: 2,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {row.map((cell, cIdx) => {
                    const selectedCell = isCellSelected(rIdx, cIdx);

                    // NOTE có collapse
                    if (cIdx === COL.NOTE) {
                      const full = String(cell || "");
                      const open = noteOpen.has(rIdx);
                      const short = full.length > 90 ? full.slice(0, 90) + "…" : full;

                      return (
                        <td
                          key={cIdx}
                          onMouseDown={(e) => onCellMouseDown(e, rIdx, cIdx)}
                          onMouseEnter={(e) => onCellMouseEnter(e, rIdx, cIdx)}
                          onDoubleClick={() => handleDoubleClickCopy(full)}
                          style={{
                            padding: "8px 10px",
                            borderRight: "1px solid #f1f5f9",
                            cursor: "cell",
                            background: selectedCell ? "#dbeafe" : "transparent",
                            userSelect: "none",
                            verticalAlign: "top",
                          }}
                          title={full}
                        >
                          <div style={{ lineHeight: 1.5 }}>
                            {open ? full : short}{" "}
                            {full.length > 90 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNote(rIdx);
                                }}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "#2563eb",
                                  cursor: "pointer",
                                  padding: 0,
                                  fontWeight: 600,
                                }}
                              >
                                [{open ? "Thu gọn" : "Xem thêm"}]
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Các ô khác
                    return (
                      <td
                        key={cIdx}
                        onMouseDown={(e) => onCellMouseDown(e, rIdx, cIdx)}
                        onMouseEnter={(e) => onCellMouseEnter(e, rIdx, cIdx)}
                        onDoubleClick={() =>
                          handleDoubleClickCopy(String(cell ?? ""))
                        }
                        style={{
                          padding: "8px 10px",
                          borderRight: "1px solid #f1f5f9",
                          textAlign:
                            typeof cell === "number" ? "right" : "left",
                          whiteSpace: "nowrap",
                          cursor: "cell",
                          background: selectedCell ? "#dbeafe" : "transparent",
                          userSelect: "none",
                        }}
                        title={String(cell ?? "")}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
