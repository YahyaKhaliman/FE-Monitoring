/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from "react";
import SimpleDatePicker from "../components/SimpleDatePicker";
import { useNavigate } from "react-router-dom";
import { getLaporan } from "../services/laporan.service";
import { useAuth } from "../context/authProvider";
import { toast } from 'react-toastify';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

function toISO(d) {
  return new Date(d).toISOString().slice(0, 10);
}
function formatDateIndo(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}
function formatDateFE(dateStr) {
  const dateOnly = dateStr.split('T')[0];
  const [y, m, d] = dateOnly.split("-");
  return `${d}-${m}-${y}`;
}
function formatNumber(n) {
  return Number(n || 0).toLocaleString("id-ID");
}
function formatPercent(p) {
  return `${Number(p || 0).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export default function LaporanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = (user?.user_bagian || "").toUpperCase() === "ADMIN";
  const cab = user?.user_cab;

  // --- States ---
  const [tglAwal, setTglAwal] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toISO(d);
  });
  const [tglAkhir, setTglAkhir] = useState(() => toISO(new Date()));
  const [kelompok, setKelompok] = useState(() =>
    isAdmin ? "" : user?.user_kelompok || "",
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [summary, setSummary] = useState({
    total_target: 0,
    total_realisasi: 0,
    capaian: 0,
    total_spk: 0,
  });
  const [perTanggal, setPerTanggal] = useState([]);
  const [perSpk, setPerSpk] = useState([]);

  // --- Data Loading ---
  const load = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await getLaporan({
        date_from: tglAwal,
        date_to: tglAkhir,
        kelompok: isAdmin
          ? kelompok || undefined
          : user?.user_kelompok || undefined,
        ...(cab ? { cab } : {}),
      });
      if (!res?.ok) {
        setMsg(res?.message || "Gagal load laporan");
        return;
      }

      setSummary({
        total_target: res.summary?.total_target || 0,
        total_realisasi: res.summary?.total_realisasi || 0,
        capaian: res.summary?.persen || 0,
        total_spk: res.by_spk?.length || 0,
      });

      setPerTanggal(
        (res.by_date || []).map((r) => ({
          name: formatDateIndo(r.tanggal),
          target: r.target,
          realisasi: r.realisasi,
        })),
      );

      setPerSpk(
        (res.by_spk || []).map((r) => ({
          spk: r.spk,
          spk_tanggal: r.spk_tanggal,
          spk_dateline: r.spk_dateline,
          nama: r.spk_nama,
          pesan: r.jml_order,
          target: r.target,
          total_realisasi: r.total_realisasi,
          realisasi: r.realisasi,
          sisa: r.sisa,
          capaian: r.persen,
          spk_close: r.spk_close,
        })),
      );
    } catch {
      setMsg("Tidak Dapat Terhubung ke Server");
    } finally {
      setLoading(false);
    }
  }, [tglAwal, tglAkhir, kelompok, isAdmin, user, cab]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPerSpk = useMemo(() => {
    const lowSearch = searchTerm.toLowerCase();
    return perSpk.filter(
      (item) =>
        item.spk.toLowerCase().includes(lowSearch) ||
        item.nama.toLowerCase().includes(lowSearch),
    );
  }, [perSpk, searchTerm]);

  const insights = useMemo(() => {
    const { total_target, total_realisasi, capaian } = summary;
    let capaianMsg = "";
    let color = "#B34E33";

    if (capaian >= 100) {
      capaianMsg = `Luar biasa! Target telah tercapai, presentase sebesar ${formatPercent(capaian)}.`;
      color = "#059669";
    } else if (capaian >= 80) {
      capaianMsg = `Produksi berjalan stabil di angka presentase ${formatPercent(capaian)}.`;
      color = "#B34E33";
    } else {
      capaianMsg = `Perhatian: Produksi saat ini masih rendah di presentase (${formatPercent(capaian)}).`;
      color = "#DC2626";
    }

    const sisa = total_target - total_realisasi;
    const sisaMsg =
      sisa > 0
        ? `Masih Kurang ${formatNumber(sisa)} unit lagi untuk mencapai target.`
        : "Target harian telah terpenuhi sepenuhnya.";

    return { capaianMsg, sisaMsg, color };
  }, [summary]);

  const pieData = [
    { name: "Realisasi", value: summary.total_realisasi, color: "#B34E33" },
    {
      name: "Kurang",
      value: Math.max(0, summary.total_target - summary.total_realisasi),
      color: "#E5E7EB",
    },
  ];

  const { logout } = useAuth();

  const handleLogout = () => {
    const Msg = ({ closeToast }) => (
      <div style={{
        fontFamily: "'Readex Pro', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Membuat konten rata tengah secara horizontal
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%'
      }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
          Apakah Anda yakin ingin keluar?
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              if (logout) logout();
              navigate("/login");
              closeToast();
            }}
            style={{
              background: '#B34E33',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Ya, Keluar
          </button>
          <button
            onClick={closeToast}
            style={{
              background: '#E5E7EB',
              color: '#374151',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            Batal
          </button>
        </div>
      </div>
    );

    toast.info(<Msg />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      icon: false,
      // Menghilangkan tombol "X" bawaan toast agar lebih bersih
      closeButton: false,
      style: {
        borderRadius: '12px',
        padding: '16px'
      }
    });
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.topTitle}>{`Monitoring Produksi ${formatDateIndo(tglAwal)} s/d ${formatDateIndo(tglAkhir)}`}</h1>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.btnSecondary} onClick={handleLogout}>
            Logout
          </button>
          <button style={styles.btnPrimary} onClick={load} disabled={loading}>
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={styles.cards}>
        <StatCard
          title="Total Target"
          value={formatNumber(summary.total_target)}
          desc={`Periode ${formatDateIndo(tglAwal)} s/d ${formatDateIndo(tglAkhir)}`}
          color="#44423e"
        />
        <StatCard
          title="Total Realisasi"
          value={formatNumber(summary.total_realisasi)}
          desc={`Periode ${formatDateIndo(tglAwal)} s/d ${formatDateIndo(tglAkhir)}`}
          color="#B34E33"
        />
        <StatCard
          title="Efektivitas"
          value={formatPercent(summary.capaian)}
          desc={`Periode ${formatDateIndo(tglAwal)} s/d ${formatDateIndo(tglAkhir)}`}
          color="#0F766E"
        />
        <StatCard
          title="Total SPK"
          value={`${perSpk.filter((r) => Number(r.spk_close) === 1).length} / ${summary.total_spk}`}
          desc="Closed / Total"
          color="#4338CA"
        />
      </div>

      {/* INSIGHT BOX */}
      <div style={{ ...styles.insightBox, borderLeftColor: insights.color }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "24px" }}>💡</span>
          <div>
            <div style={{ ...styles.insightTitle, color: insights.color }}>
              Analisis Produksi Otomatis
            </div>
            <div style={styles.insightText}>
              {insights.capaianMsg} {insights.sisaMsg}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div style={styles.chartGrid}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>{`Grafik Target vs Realisasi ${formatDateIndo(tglAwal)} - ${formatDateIndo(tglAkhir)}`}</h3>
          <div style={{ width: "100%", height: 300, marginTop: 20 }}>
            <ResponsiveContainer>
              <BarChart data={perTanggal}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  stroke="#6B7280"
                  fontWeight={600}
                />
                <YAxis fontSize={11} stroke="#6B7280" fontWeight={600} />
                <Tooltip
                  cursor={{ fill: "#F9FAFB" }}
                  contentStyle={styles.tooltip}
                />
                <Bar
                  dataKey="target"
                  fill="#E8D8C3"
                  radius={[4, 4, 0, 0]}
                  name="Target"
                >
                  <LabelList
                    dataKey="target"
                    position="insideBottom"
                    formatter={formatNumber}
                    fontSize={11}
                    fontFamily="'Inter', sans-serif"
                    fontWeight={700}
                    fill="#000000"
                  />
                </Bar>
                <Bar
                  dataKey="realisasi"
                  fill="#C96E4D"
                  radius={[4, 4, 0, 0]}
                  name="Realisasi"
                >
                  <LabelList
                    dataKey="realisasi"
                    position="insideBottom"
                    formatter={formatNumber}
                    fontSize={11}
                    fontFamily="'Inter', sans-serif"
                    fontWeight={700}
                    fill="#000000"
                  />
                </Bar>
                  <Legend iconType="square" align="center" payload={[
                    { value: 'Realisasi', color: '#C96E4D' },
                    { value: 'Target', color: '#E8D8C3' }
                  ]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Rasio Capaian</h3>
          <div style={{ width: "100%", height: 300, position: "relative" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.pieCenterText}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#B34E33",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {Math.round(summary.capaian)}%
              </div>
              <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 800 }}>
                CAPAIAN
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Pencarian SPK / Nama</label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              style={styles.inputSearch}
              placeholder="Cari SPK atau Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={styles.clearBtn}
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Periode</label>
          <div style={{ display: "flex", gap: 10 }}>
            <SimpleDatePicker
              value={tglAwal}
              onChange={setTglAwal}
              maxDate={tglAkhir}
            />
            <SimpleDatePicker
              value={tglAkhir}
              onChange={setTglAkhir}
              minDate={tglAwal}
            />
          </div>
        </div>
        <button
          style={styles.btnToday}
          onClick={() => {
            const n = toISO(new Date());
            setTglAwal(n);
            setTglAkhir(n);
          }}
        >
          Hari Ini
        </button>
      </div>

      {msg && <div style={styles.errorAlert}>{msg}</div>}

      {/* DATA TABLE */}
      <div style={styles.panelTable}>
        <div style={styles.tableHeader}>
          <h3
            style={styles.panelTitleTable}
          >{`Detail Produksi Periode ${formatDateIndo(tglAwal)} s/d ${formatDateIndo(tglAkhir)}`}</h3>
          <span style={styles.tableSubtitle}>
            Menampilkan {filteredPerSpk.length} Data
          </span>
        </div>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>

              <tr>
                <th style={styles.th}>Identitas SPK</th>
                <th style={styles.thDaily}>Target</th>
                <th style={styles.thDaily}>Realisasi</th>
                <th style={styles.thHighlight}>Order</th>
                <th style={styles.thHighlight}>
                  Total
                  <br />
                  Realisasi
                </th>
                <th style={styles.thHighlight}>Progress</th>
                <th style={styles.thHighlight}>Detail</th>
                <th style={styles.thCenter}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerSpk.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#9CA3AF",
                    }}
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                filteredPerSpk.map((r, i) => (
                  <tr
                    key={i}
                    style={i % 2 === 0 ? styles.trEven : styles.trOdd}
                  >
                    <td style={styles.td}>
                      <div style={styles.spkName}>{r.nama}</div>
                      <div style={styles.spkId}>{r.spk}</div>
                      <div style={styles.timelineInfo}>
                        <span title="Tanggal Pesan">Order: {formatDateFE(r.spk_tanggal)}</span>
                        <span style={{ margin: '0 4px' }}>•</span>
                        <span
                          title="Deadline Selesai"
                          style={{
                            color: new Date(r.spk_dateline) < new Date() ? '#DC2626' : '#27be4a',
                            fontWeight: new Date(r.spk_dateline) < new Date() ? 700 : 600
                          }}
                        >
                          Dateline: {formatDateFE(r.spk_dateline)}
                        </span>
                      </div>
                    </td>
                    <td style={styles.tdDaily}>{formatNumber(r.target)}</td>
                    <td style={styles.tdDaily}>{formatNumber(r.realisasi)}</td>
                    <td style={styles.tdHighlightNum}>
                      {formatNumber(r.pesan)}
                    </td>
                    <td style={styles.tdHighlightNum}>
                      {formatNumber(r.total_realisasi)}
                    </td>
                    <td style={styles.tdHighlightNum}>
                      <div style={styles.progressBg}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${Math.min((r.total_realisasi / r.pesan) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#374151",
                          fontSize: "12px",
                          marginTop: "4px",
                        }}
                      >
                        {formatPercent((r.total_realisasi / r.pesan) * 100)}
                      </div>
                    </td>
                    <td
                      style={{
                        ...styles.tdHighlightNum,
                        color: r.sisa < 0 ? "#DC2626" : "#059669",
                        fontWeight: 800,
                      }}
                    >
                      {r.sisa < 0
                        ? `Kurang ${formatNumber(r.sisa)}`
                        : `Sisa ${formatNumber(r.sisa)}`}
                    </td>
                    <td style={styles.tdNum}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background:
                            Number(r.spk_close) === 1 ? "#DCFCE7" : "#FEE2E2",
                          color:
                            Number(r.spk_close) === 1 ? "#166534" : "#991B1B",
                        }}
                      >
                        {Number(r.spk_close) === 1 ? "CLOSED" : "OPEN"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Internal Components ---
function StatCard({ title, value, desc, color }) {
  return (
    <div style={styles.card}>
      <div
        style={{
          fontSize: 11,
          color: "#6B7280",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: color,
          margin: "4px 0",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#4B5563", fontWeight: 500 }}>
        {desc}
      </div>
    </div>
  );
}

// --- Styles Object ---
const styles = {
  tdCenter: {
    textAlign: "center",
    verticalAlign: "middle",
    padding: "10px",
    borderBottom: "1px solid #F3F4F6",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
  },
  page: {
    background: "#F9FAFB",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "'Readex Pro', sans-serif",
    color: "#111827",
    maxWidth: "1280px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  topTitle: { fontSize: "28px", fontWeight: 800, color: "#111827", margin: 0 },
  headerActions: { display: "flex", gap: "12px" },

  btnPrimary: {
    background: "#B34E33",
    color: "#fff",
    border: 0,
    padding: "0 24px",
    height: "46px",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "#fff",
    color: "#374151",
    border: "1px solid #D1D5DB",
    padding: "0 24px",
    height: "46px",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #E5E7EB",
  },

  insightBox: {
    background: "#FFFFFF",
    padding: "20px 24px",
    borderRadius: "12px",
    marginBottom: "32px",
    border: "1px solid #E5E7EB",
    borderLeftWidth: "6px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  insightTitle: {
    fontSize: "12px",
    fontWeight: 800,
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  insightText: { fontSize: "15px", color: "#374151", fontWeight: 500 },

  chartGrid: {
    display: "grid",
    gridTemplateColumns: "2.2fr 1fr",
    gap: "24px",
    marginBottom: "32px",
  },
  panel: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #E5E7EB",
  },
  panelTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#111827",
    margin: 0,
    textAlign: "center",
  },
  pieCenterText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },

  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    alignItems: "flex-end",
    background: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
    border: "1px solid #D1D5DB",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#374151",
    textTransform: "uppercase",
  },
  input: {
    height: "42px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    padding: "0 12px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
  },
  inputSearch: {
    height: "42px",
    borderRadius: "8px",
    border: "2px solid #B34E33",
    padding: "0 16px",
    fontSize: "14px",
    width: "260px",
    outline: "none",
  },
  clearBtn: {
    position: "absolute",
    right: 10,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    color: "#B34E33",
  },
  btnToday: {
    background: "#1F2937",
    color: "#fff",
    border: 0,
    padding: "0 16px",
    height: "42px",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  panelTable: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  tableHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #F3F4F6",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  panelTitleTable: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#111827",
    margin: 0,
  },
  tableSubtitle: { fontSize: "12px", color: "#6B7280", fontWeight: 600 },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    maxHeight: "600px", // Memberikan area scroll internal
    overflowY: "auto",
    position: 'relative',
    borderRadius: "0 0 16px 16px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: "900px",
    border: "1px solid #E5E7EB",
  },
  th: {
    textAlign: "left",
    padding: "16px 24px",
    background: "#F9FAFB",
    color: "#4B5563",
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    borderBottom: "2px solid #E5E7EB",
    border: "1px solid #E5E7EB",
    letterSpacing: "0.05em",
    position: 'sticky',
    top: 0,
    zIndex: 11,
  },
  thDaily: {
    textAlign: "center",
    padding: "16px",
    background: "#F0F7FF",
    color: "#2563EB",
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    borderBottom: "2px solid #3B82F6",
    position: 'sticky',
    top: 0,
    zIndex: 11,
  },
  thCenter: {
    textAlign: "center",
    padding: "16px",
    background: "#F9FAFB",
    color: "#4B5563",
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    borderBottom: "2px solid #E5E7EB",
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  thHighlight: {
    textAlign: "center",
    padding: "16px",
    background: "#FFF7ED",
    color: "#B34E33",
    fontWeight: 800,
    fontSize: "11px",
    textTransform: "uppercase",
    borderBottom: "2px solid #B34E33",
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  trEven: { background: "#FFFFFF" },
  trOdd: { background: "#F8FAFC" },

  spkName: { fontWeight: 800, color: "#111827", fontSize: "14px" },
  spkId: {
    fontSize: "12px",
    color: "#6B7280",
    fontWeight: 500,
    marginTop: "2px",
    fontFamily: "'Inter', sans-serif",
  },

  statusBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  progressBg: {
    width: "100%",
    height: "8px",
    background: "#efeded",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressFill: { height: "100%", background: "#B34E33", borderRadius: "10px" },

  errorAlert: {
    padding: "16px",
    background: "#FEE2E2",
    color: "#B91C1C",
    borderRadius: "10px",
    marginBottom: "20px",
    fontWeight: 700,
  },
  tooltip: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },

  td: {
    padding: "16px 24px",
    verticalAlign: "middle",
    borderBottom: "1px solid #14387e"
  },
  tdDaily: {
    padding: "16px",
    textAlign: "center",
    verticalAlign: "middle",
    borderBottom: "1px solid #14387e",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    color: "#1E40AF",
    background: "#F8FBFF",
  },
  tdHighlightNum: {
    padding: "16px",
    textAlign: "center",
    fontSize: "14px",
    verticalAlign: "middle",
    borderBottom: "1px solid #14387e",
    background: "#FFFBF7",
    fontWeight: 700,
    color: "#B34E33",
    fontFamily: "'Inter', sans-serif",
  },
  tdNum: {
    padding: "16px",
    textAlign: "center",
    verticalAlign: "middle",
    borderBottom: "1px solid #14387e",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    color: "#374151",
  },
  timelineInfo: {
    fontSize: "11px",
    color: "#4e5052",
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    fontFamily: "'Inter', sans-serif",
  },
};
