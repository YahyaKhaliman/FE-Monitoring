/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import {
    getMonitoring,
    getMonitoringKelompok,
    getMonitoringLini,
} from "../services/monitoringJob.service";
import { loadUser } from "../utils/storage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";

export default function MonitoringJobPage() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const localUser = useMemo(() => loadUser(), []);
    const user = authUser || localUser;

    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
    const [lini, setLini] = useState("");
    const [kelompok, setKelompok] = useState("");
    const [liniOptions, setLiniOptions] = useState([]);
    const [kelompokOptions, setKelompokOptions] = useState([]);
    const [rows, setRows] = useState([]);
    const [avg, setAvg] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    async function loadMonitoring() {
        if (!user?.user_cab || !lini || !kelompok || !tanggal) return;
        try {
            setLoading(true);
            setErrorMsg("");
            const res = await getMonitoring({
                cab: user.user_cab,
                tanggal,
                lini,
                kelompok,
            });

            if (res.ok) {
                setRows(res.data || []);
                setAvg(res.avg_persen || 0);
            } else {
                setRows([]);
                setAvg(0);
                setErrorMsg(res?.message || "Gagal memuat data monitoring");
            }
        } catch (e) {
            setRows([]);
            setAvg(0);
            setErrorMsg(e?.response?.data?.message || e?.message || "Tidak bisa konek ke server monitoring");
            console.error("Gagal sinkronisasi monitoring", e);
        } finally {
            setLoading(false);
        }
    }

    // Ambil data lini saat user.cab berubah
    useEffect(() => {
        if (!user?.user_cab) return;
        (async () => {
            try {
                const resLini = await getMonitoringLini({ cab: user.user_cab });
                const liniData = resLini?.ok ? (resLini.data || []) : [];
                setLiniOptions(liniData);
                // Set default lini jika belum ada
                if (liniData.length > 0) {
                    setLini(liniData[0].lini);
                } else {
                    setLini("JAHIT");
                }
            } catch {
                setLiniOptions([]);
                setLini("JAHIT");
            }
        })();
    }, [user?.user_cab]);

    // Ambil data kelompok saat lini berubah
    useEffect(() => {
        if (!user?.user_cab || !lini) {
            setKelompokOptions([]);
            setKelompok("");
            return;
        }
        (async () => {
            try {
                const resKelompok = await getMonitoringKelompok({
                    cab: user.user_cab,
                    lini,
                });
                const kelompokData = resKelompok?.ok ? (resKelompok.data || []) : [];
                setKelompokOptions(kelompokData);
                // Set default kelompok jika belum ada
                if (kelompokData.length > 0) {
                    setKelompok(kelompokData[0].kelompok);
                } else {
                    setKelompok("Line A");
                }
            } catch {
                setKelompokOptions([]);
                setKelompok("Line A");
            }
        })();
    }, [user?.user_cab, lini]);

    // Panggil loadMonitoring setiap filter berubah dan sudah terisi
    useEffect(() => {
        if (!user?.user_cab || !lini || !kelompok || !tanggal) return;
        loadMonitoring();
        // Auto refresh setiap 20 detik
        const t = setInterval(loadMonitoring, 20000);
        return () => clearInterval(t);
    }, [tanggal, lini, kelompok]);

    return (
        <div style={styles.page}>
            {/* HEADER AREA */}
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button style={styles.btnBack} onClick={() => navigate("/menu")}>← Back</button>
                    <div>
                        <div style={styles.title}>DASHBOARD MONITORING PRODUKSI</div>
                        <div style={styles.sub}>
                            Cabang: {user?.user_cab} • Lini: {lini} • {new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* BIG SCORE INDICATOR */}
                <div style={{ ...styles.avgCard, background: avg >= 85 ? "#059669" : avg >= 70 ? "#B34E33" : "#DC2626" }}>
                    <div style={styles.avgLabel}>EFEKTIVITAS TOTAL</div>
                    <div style={styles.avgValue}>{avg}%</div>
                </div>
            </div>

            {/* FILTER BAR */}
            <div style={styles.filterBar}>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Pilih Tanggal</label>
                    <input type="date" style={styles.input} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Lini</label>
                    <select style={styles.select} value={lini} onChange={(e) => setLini(e.target.value)}>
                        {liniOptions.length === 0 && <option value="">Tidak ada lini</option>}
                        {liniOptions.map((item) => (
                            <option key={item.lini} value={item.lini}>{item.lini}</option>
                        ))}
                    </select>
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Kelompok</label>
                    <select style={styles.select} value={kelompok} onChange={(e) => setKelompok(e.target.value)}>
                        {kelompokOptions.length === 0 && <option value="">Tidak ada kelompok</option>}
                        {kelompokOptions.map((item) => (
                            <option key={item.kelompok} value={item.kelompok}>{item.kelompok}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                    <button style={styles.btnRefresh} onClick={loadMonitoring} disabled={loading || !lini || !kelompok}>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            {/* MONITORING TABLE */}
            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>JAM</th>
                            <th style={styles.th}>MP</th>
                            <th style={styles.th}>DETAIL SPK / BARANG</th>
                            <th style={styles.thCenter}>TARGET</th>
                            <th style={styles.thCenter}>REALISASI</th>
                            <th style={styles.thCenter}>CAPAIAN (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={6} style={styles.tdEmpty}>Menunggu data produksi...</td></tr>
                        ) : (
                            rows.map((r, i) => (
                                <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                                    <td style={styles.tdJam}>🕒 {(r.jam || "").replace("-", "")}</td>
                                    <td style={styles.tdMp}>{r.mp}</td>
                                    <td style={styles.tdSpk}>{r.spk}</td>
                                    <td style={styles.tdTarget}>{r.target}</td>
                                    <td style={styles.tdRealisasi}>{r.realisasi}</td>
                                    <td style={styles.tdCenter}>
                                        <div style={{
                                            ...styles.percentBadge,
                                            background: r.persen >= 100 ? "#DCFCE7" : r.persen >= 80 ? "#FFF7ED" : "#FEE2E2",
                                            color: r.persen >= 100 ? "#166534" : r.persen >= 80 ? "#9A3412" : "#991B1B"
                                        }}>
                                            {r.persen}%
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={styles.footer}>
                Auto-Refresh Active: Data diperbarui otomatis setiap 20 detik
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "24px",
        fontFamily: "'Readex Pro', sans-serif",
        color: "#111827"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        background: "#fff",
        padding: "20px 24px",
        borderRadius: "20px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
    },
    title: { fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" },
    sub: { fontSize: "13px", color: "#6B7280", marginTop: "4px" },

    avgCard: {
        padding: "12px 32px",
        borderRadius: "16px",
        textAlign: "center",
        color: "#fff",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
    },
    avgLabel: { fontSize: "10px", fontWeight: 700, opacity: 0.9 },
    avgValue: { fontSize: "32px", fontWeight: 900, fontFamily: "'Inter', sans-serif" },

    filterBar: {
        display: "flex",
        gap: "16px",
        marginBottom: "24px",
        background: "#fff",
        padding: "16px 20px",
        borderRadius: "16px",
        border: "1px solid #E5E7EB"
    },
    filterGroup: { flex: 1, display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "11px", fontWeight: 800, color: "#374151", textTransform: "uppercase" },
    input: { height: "40px", borderRadius: "8px", border: "1px solid #D1D5DB", padding: "0 12px", fontSize: "14px", outline: "none" },
    select: { height: "40px", borderRadius: "8px", border: "1px solid #D1D5DB", padding: "0 12px", outline: "none", cursor: "pointer" },

    tableWrap: {
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "16px 24px", background: "#F9FAFB", fontSize: "12px", fontWeight: 800, color: "#4B5563", textTransform: "uppercase", borderBottom: "2px solid #E5E7EB" },
    thCenter: { textAlign: "center", padding: "16px 24px", background: "#F9FAFB", fontSize: "12px", fontWeight: 800, color: "#4B5563", textTransform: "uppercase", borderBottom: "2px solid #E5E7EB" },

    td: { padding: "16px 24px", borderBottom: "1px solid #F3F4F6" },
    tdJam: { padding: "16px 24px", borderBottom: "1px solid #F3F4F6", fontWeight: 800, color: "#1E40AF", background: "#F0F7FF", fontSize: "15px" },
    tdMp: { padding: "16px 24px", borderBottom: "1px solid #F3F4F6", textAlign: "center", fontWeight: 700, fontSize: "16px" },
    tdSpk: { padding: "16px 24px", borderBottom: "1px solid #F3F4F6", whiteSpace: "pre-line", fontSize: "14px", fontWeight: 500, color: "#374151" },
    tdTarget: { padding: "16px 24px", borderBottom: "1px solid #F3F4F6", textAlign: "center", fontSize: "16px", fontWeight: 600, color: "#6B7280" },
    tdRealisasi: { padding: "16px 24px", borderBottom: "1px solid #F3F4F6", textAlign: "center", fontSize: "18px", fontWeight: 800, color: "#111827", fontFamily: "'Inter', sans-serif" },

    percentBadge: {
        padding: "6px 12px",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: 800,
        textAlign: "center",
        display: "inline-block",
        minWidth: "60px"
    },

    trEven: { background: "#FFFFFF" },
    trOdd: { background: "#FBFBFA" },
    tdEmpty: { padding: "60px", textAlign: "center", color: "#9CA3AF", fontStyle: "italic" },

    btnBack: { background: "none", border: "none", color: "#6B7280", fontWeight: 700, cursor: "pointer", fontSize: "14px" },
    btnRefresh: { height: "40px", borderRadius: "8px", border: 0, background: "#B34E33", color: "#fff", fontWeight: 700, padding: "0 16px", cursor: "pointer" },
    errorBox: { marginBottom: "14px", background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", fontWeight: 600 },
    footer: { marginTop: "20px", textAlign: "center", fontSize: "11px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }
};