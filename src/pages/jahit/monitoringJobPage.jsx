/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import {
    getMonitoring,
    getMonitoringKelompok,
    getMonitoringLini,
} from "../../services/monitoringJob.service";
import { getSpkTargets } from "../../services/spkTarget.service";
import { loadUser } from "../../utils/storage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authProvider";
import { MdArrowBack } from "react-icons/md";

export default function MonitoringJobPage() {
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth <= 600;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const { user: authUser } = useAuth();
    const localUser = useMemo(() => loadUser(), []);
    const user = authUser || localUser;
    const userCab =
        user?.user_cab ||
        user?.cab ||
        user?.user_cabang ||
        user?.cabang ||
        user?.cab_kode ||
        "";
    const userBagian = String(user?.user_bagian || "")
        .trim()
        .toUpperCase();
    const userKelompok = String(user?.user_kelompok || "")
        .trim()
        .toUpperCase();
    const isAdmin = ["ADMIN", "IT"].includes(userBagian);

    const [tanggal, setTanggal] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [lini, setLini] = useState("");
    const [kelompok, setKelompok] = useState("");
    const [liniOptions, setLiniOptions] = useState([]);
    const [kelompokOptions, setKelompokOptions] = useState([]);
    const [rows, setRows] = useState([]);
    const [persen, setAvg] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [spkMap, setSpkMap] = useState({});

    async function loadMonitoring() {
        if (!userCab || !lini || !kelompok || !tanggal) return;
        try {
            setLoading(true);
            setErrorMsg("");
            const [res, spkRes] = await Promise.all([
                getMonitoring({
                    cab: userCab,
                    tanggal,
                    lini,
                    kelompok,
                }),
                getSpkTargets(userCab, lini).catch((err) => {
                    console.error("Gagal load spk targets", err);
                    return { ok: false };
                }),
            ]);

            // Bangun map nomor SPK -> nama SPK
            const newSpkMap = {};
            if (spkRes?.ok && Array.isArray(spkRes.data)) {
                spkRes.data.forEach((item) => {
                    if (item.nomor) {
                        newSpkMap[String(item.nomor).trim().toUpperCase()] =
                            item.nama || "";
                    }
                });
            }
            setSpkMap(newSpkMap);

            if (res.ok) {
                const monitorData = res.data || {};
                const isNewFormat =
                    monitorData &&
                    typeof monitorData === "object" &&
                    "list" in monitorData;

                const rowsData = isNewFormat
                    ? monitorData.list || []
                    : res.data || [];
                const persenData = isNewFormat
                    ? monitorData.persen || 0
                    : res.persen || 0;

                setRows(rowsData);
                setAvg(persenData);
            } else {
                setRows([]);
                setAvg(0);
                setErrorMsg(res?.message || "Gagal memuat data monitoring");
            }
        } catch (e) {
            setRows([]);
            setAvg(0);
            setErrorMsg(
                e?.response?.data?.message ||
                    e?.message ||
                    "Tidak bisa konek ke server monitoring",
            );
            console.error("Gagal sinkronisasi monitoring", e);
        } finally {
            setLoading(false);
        }
    }

    // Ambil data lini saat user.cab berubah
    useEffect(() => {
        if (!userCab) {
            setErrorMsg(
                "Data cabang user tidak ditemukan. Silakan login ulang.",
            );
            return;
        }
        (async () => {
            try {
                const resLini = await getMonitoringLini({ cab: userCab });
                const liniData = resLini?.ok ? resLini.data || [] : [];
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
    }, [userCab]);

    // Ambil data kelompok saat lini berubah
    useEffect(() => {
        if (!userCab || !lini) {
            setKelompokOptions([]);
            setKelompok("");
            return;
        }
        (async () => {
            try {
                const resKelompok = await getMonitoringKelompok({
                    cab: userCab,
                    lini,
                });
                const kelompokData = resKelompok?.ok
                    ? resKelompok.data || []
                    : [];
                setKelompokOptions(kelompokData);

                const hasUserKelompok = kelompokData.some(
                    (item) =>
                        String(item.kelompok || "")
                            .trim()
                            .toUpperCase() === userKelompok,
                );

                // Jika user bagian JAHIT, default-kan ke kelompok user login.
                // Selain itu tetap ALL.
                if (userBagian === "JAHIT" && userKelompok && hasUserKelompok) {
                    setKelompok(userKelompok);
                } else {
                    setKelompok("ALL");
                }
            } catch {
                setKelompokOptions([]);
                setKelompok("ALL");
            }
        })();
    }, [userCab, lini, userBagian, userKelompok]);

    useEffect(() => {
        if (!userCab || !lini || !kelompok || !tanggal) return;
        loadMonitoring();
    }, [tanggal, lini, kelompok]);

    function getSpkCount(spkText) {
        const raw = String(spkText || "").trim();
        if (!raw) return 0;

        if (raw.includes(",")) {
            return raw
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean).length;
        }

        return 1;
    }

    function renderSpkDetail(spkText, isMobileView = false) {
        const spkNos = String(spkText || "")
            .split(",")
            .map((x) => x.trim().toUpperCase())
            .filter(Boolean);

        if (spkNos.length === 0) {
            return (
                <div style={{ color: "#9CA3AF", fontStyle: "italic" }}>
                    Tidak ada SPK
                </div>
            );
        }

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobileView ? "8px" : "6px",
                }}
            >
                {spkNos.map((no, idx) => {
                    const name = spkMap[no] || "-";
                    return (
                        <div
                            key={idx}
                            style={{
                                borderBottom:
                                    idx < spkNos.length - 1
                                        ? "1px dashed #E5E7EB"
                                        : "none",
                                paddingBottom:
                                    idx < spkNos.length - 1 ? "6px" : "0",
                                marginTop: idx > 0 ? "4px" : "0",
                            }}
                        >
                            <div
                                style={
                                    isMobileView
                                        ? styles.cardSpkName
                                        : styles.spkNameText
                                }
                            >
                                {name}
                            </div>
                            <div
                                style={
                                    isMobileView
                                        ? styles.cardSpkNo
                                        : styles.spkNoText
                                }
                            >
                                No. SPK: {no}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            style={{
                ...styles.page,
                padding: isMobile ? "12px" : "24px",
            }}
        >
            {/* HEADER AREA */}
            <div
                style={{
                    ...styles.header,
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "center",
                    gap: isMobile ? "16px" : "12px",
                    padding: isMobile ? "16px" : "20px 24px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        style={styles.btnBack}
                        onClick={() => navigate("/menu")}
                        aria-label="Kembali"
                    >
                        <MdArrowBack size={20} />
                    </button>
                    <div>
                        <div style={styles.title}>
                            DASHBOARD MONITORING PRODUKSI HARIAN
                        </div>
                        <div style={styles.sub}>
                            Cabang: {userCab || "-"} •{" "}
                            {new Date(tanggal).toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </div>
                    </div>
                </div>

                {/* BIG SCORE INDICATOR */}
                <div
                    style={{
                        ...styles.avgCard,
                        width: isMobile ? "100%" : "auto",
                        boxSizing: "border-box",
                        background:
                            persen >= 85
                                ? "#059669"
                                : persen >= 70
                                  ? "#B34E33"
                                  : "#DC2626",
                    }}
                >
                    <div style={styles.avgLabel}>EFEKTIVITAS TOTAL</div>
                    <div style={styles.avgValue}>{persen}%</div>
                </div>
            </div>

            {/* FILTER BAR */}
            <div
                style={{
                    ...styles.filterBar,
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "end",
                    gap: isMobile ? "12px" : "16px",
                    padding: isMobile ? "16px" : "16px 20px",
                }}
            >
                <div style={{ ...styles.filterGroup, width: "100%" }}>
                    <label style={styles.label}>Pilih Tanggal</label>
                    <input
                        type="date"
                        style={{
                            ...styles.input,
                            width: "100%",
                            boxSizing: "border-box",
                        }}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                    />
                </div>
                <div style={{ ...styles.filterGroup, width: "100%" }}>
                    <label style={styles.label}>Lini</label>
                    <select
                        style={{
                            ...styles.select,
                            width: "100%",
                            boxSizing: "border-box",
                            height: 40,
                        }}
                        value={lini}
                        onChange={(e) => setLini(e.target.value)}
                    >
                        {liniOptions.length === 0 && (
                            <option value="">Tidak ada lini</option>
                        )}
                        {liniOptions.map((item) => (
                            <option key={item.lini} value={item.lini}>
                                {item.lini}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ ...styles.filterGroup, width: "100%" }}>
                    <label style={styles.label}>Kelompok</label>
                    <select
                        style={{
                            ...styles.select,
                            width: "100%",
                            boxSizing: "border-box",
                            height: 40,
                        }}
                        value={kelompok}
                        onChange={(e) => setKelompok(e.target.value)}
                        disabled={!isAdmin}
                    >
                        <option value="ALL">ALL</option>
                        {kelompokOptions.length === 0 && (
                            <option value="">Tidak ada kelompok</option>
                        )}
                        {kelompokOptions.map((item) => (
                            <option key={item.kelompok} value={item.kelompok}>
                                {item.kelompok}
                            </option>
                        ))}
                    </select>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "end",
                        width: isMobile ? "100%" : "auto",
                    }}
                >
                    <button
                        style={{
                            ...styles.btnRefresh,
                            width: isMobile ? "100%" : "auto",
                            height: "40px",
                        }}
                        onClick={loadMonitoring}
                        disabled={loading || !lini || !kelompok}
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            {/* DATA SECTION */}
            {isMobile ? (
                /* Tampilan Card khusus Mobile */
                <div style={styles.cardList}>
                    {rows.length === 0 ? (
                        <div style={styles.tdEmpty}>
                            Menunggu data produksi...
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            {rows.map((r, i) => (
                                <div key={i} style={styles.mobileCard}>
                                    <div style={styles.cardHeader}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <span style={styles.cardJamBadge}>
                                                Jam {r.jam}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                ...styles.percentBadge,
                                                padding: "4px 8px",
                                                fontSize: "12px",
                                                minWidth: "auto",
                                                background:
                                                    r.persen >= 100
                                                        ? "#DCFCE7"
                                                        : r.persen >= 80
                                                          ? "#FFF7ED"
                                                          : "#FEE2E2",
                                                color:
                                                    r.persen >= 100
                                                        ? "#166534"
                                                        : r.persen >= 80
                                                          ? "#9A3412"
                                                          : "#991B1B",
                                            }}
                                        >
                                            {r.persen}%
                                        </div>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.cardSpkInfo}>
                                            {renderSpkDetail(r.spk, true)}
                                            <div style={styles.cardSpkMeta}>
                                                MP: {r.mp} orang &nbsp;•&nbsp;
                                                Total SPK: {getSpkCount(r.spk)}
                                            </div>
                                        </div>
                                        <div style={styles.cardStatsGrid}>
                                            <div
                                                style={styles.cardStatBoxTarget}
                                            >
                                                <span
                                                    style={styles.cardStatLabel}
                                                >
                                                    Target
                                                </span>
                                                <span
                                                    style={styles.cardStatVal}
                                                >
                                                    {r.target}
                                                </span>
                                            </div>
                                            <div
                                                style={
                                                    styles.cardStatBoxRealisasi
                                                }
                                            >
                                                <span
                                                    style={styles.cardStatLabel}
                                                >
                                                    Realisasi
                                                </span>
                                                <span
                                                    style={styles.cardStatVal}
                                                >
                                                    {r.realisasi}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Tampilan Tabel untuk Tablet & Desktop */
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, ...styles.colJam }}>
                                    JAM
                                </th>
                                <th style={{ ...styles.th, ...styles.colMp }}>
                                    Man Power
                                </th>
                                <th style={{ ...styles.th, ...styles.colSpk }}>
                                    DETAIL SPK / BARANG
                                </th>
                                <th
                                    style={{
                                        ...styles.thCenter,
                                        ...styles.colNum,
                                    }}
                                >
                                    TARGET
                                </th>
                                <th
                                    style={{
                                        ...styles.thCenter,
                                        ...styles.colNum,
                                    }}
                                >
                                    REALISASI
                                </th>
                                <th
                                    style={{
                                        ...styles.thCenter,
                                        ...styles.colNum,
                                    }}
                                >
                                    CAPAIAN (%)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={styles.tdEmpty}>
                                        Menunggu data produksi...
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r, i) => (
                                    <tr
                                        key={i}
                                        style={
                                            i % 2 === 0
                                                ? styles.trEven
                                                : styles.trOdd
                                        }
                                    >
                                        <td style={styles.tdJam}>
                                            {r.jam || ""}
                                        </td>
                                        <td style={styles.tdMp}>{r.mp}</td>
                                        <td style={styles.tdSpk}>
                                            {renderSpkDetail(r.spk, false)}
                                            <div style={styles.spkMeta}>
                                                Total SPK: {getSpkCount(r.spk)}
                                            </div>
                                        </td>
                                        <td style={styles.tdTarget}>
                                            {r.target}
                                        </td>
                                        <td style={styles.tdRealisasi}>
                                            {r.realisasi}
                                        </td>
                                        <td style={styles.tdCenter}>
                                            <div
                                                style={{
                                                    ...styles.percentBadge,
                                                    background:
                                                        r.persen >= 100
                                                            ? "#DCFCE7"
                                                            : r.persen >= 80
                                                              ? "#FFF7ED"
                                                              : "#FEE2E2",
                                                    color:
                                                        r.persen >= 100
                                                            ? "#166534"
                                                            : r.persen >= 80
                                                              ? "#9A3412"
                                                              : "#991B1B",
                                                }}
                                            >
                                                {r.persen}%
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "24px",
        fontFamily: "'Readex Pro', sans-serif",
        color: "#111827",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "24px",
        background: "#fff",
        padding: "20px 24px",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    title: { fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" },
    sub: { fontSize: "13px", color: "#6B7280", marginTop: "4px" },

    avgCard: {
        padding: "12px 32px",
        borderRadius: "16px",
        textAlign: "center",
        color: "#fff",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    },
    avgLabel: { fontSize: "10px", fontWeight: 700, opacity: 0.9 },
    avgValue: {
        fontSize: "32px",
        fontWeight: 900,
        fontFamily: "'Inter', sans-serif",
    },

    filterBar: {
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "24px",
        background: "#fff",
        padding: "16px 20px",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
    },
    filterGroup: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "11px",
        fontWeight: 800,
        color: "#374151",
        textTransform: "uppercase",
    },
    input: {
        height: "40px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        padding: "0 12px",
        fontSize: "14px",
        outline: "none",
        fontFamily: "inherit",
    },
    select: {
        height: "40px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        padding: "0 12px",
        outline: "none",
        cursor: "pointer",
    },

    tableWrap: {
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        overflow: "hidden",
        overflowX: "auto",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "700px",
    },
    colJam: { width: "12%" },
    colMp: { width: "10%" },
    colSpk: { width: "42%" },
    colNum: { width: "12%" },
    th: {
        textAlign: "left",
        padding: "16px 24px",
        background: "#F9FAFB",
        fontSize: "12px",
        fontWeight: 800,
        color: "#4B5563",
        textTransform: "uppercase",
        borderBottom: "2px solid #E5E7EB",
    },
    thCenter: {
        textAlign: "center",
        padding: "16px 24px",
        background: "#F9FAFB",
        fontSize: "12px",
        fontWeight: 800,
        color: "#4B5563",
        textTransform: "uppercase",
        borderBottom: "2px solid #E5E7EB",
    },

    td: { padding: "16px 24px", borderBottom: "1px solid #F3F4F6" },
    tdJam: {
        padding: "16px 24px",
        borderBottom: "1px solid #F3F4F6",
        fontWeight: 800,
        color: "#1E40AF",
        background: "#F0F7FF",
        fontSize: "15px",
    },
    tdMp: {
        padding: "16px 24px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "16px",
    },
    tdSpk: {
        padding: "16px 24px",
        borderBottom: "1px solid #F3F4F6",
        whiteSpace: "pre-line",
        fontSize: "14px",
        fontWeight: 500,
        color: "#374151",
    },
    spkMeta: {
        marginTop: "6px",
        fontSize: "11px",
        fontWeight: 700,
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    },
    spkNameText: {
        fontSize: "14px",
        fontWeight: 800,
        color: "#111827",
    },
    spkNoText: {
        fontSize: "12px",
        color: "#4B5563",
        fontWeight: 600,
        marginTop: "2px",
    },
    tdTarget: {
        padding: "16px 24px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: 600,
        color: "#6B7280",
    },
    tdRealisasi: {
        padding: "16px 24px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontSize: "18px",
        fontWeight: 800,
        color: "#111827",
        fontFamily: "'Inter', sans-serif",
    },
    tdCenter: {
        padding: "16px 24px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontSize: "14px",
        color: "#374151",
    },

    percentBadge: {
        padding: "6px 12px",
        borderRadius: "10px",
        fontSize: "15px",
        fontWeight: 800,
        textAlign: "center",
        display: "inline-block",
        minWidth: "60px",
    },

    trEven: { background: "#FFFFFF" },
    trOdd: { background: "#FBFBFA" },
    tdEmpty: {
        padding: "60px",
        textAlign: "center",
        color: "#9CA3AF",
        fontStyle: "italic",
    },

    btnBack: {
        background: "#F3F4F6",
        border: "none",
        color: "#4B5563",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        outline: "none",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    },
    btnRefresh: {
        height: 38,
        padding: "0 16px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        background: "#fff",
        color: "#374151",
        fontWeight: 700,
        cursor: "pointer",
    },
    errorBox: {
        marginBottom: "14px",
        background: "#FEE2E2",
        color: "#991B1B",
        border: "1px solid #FCA5A5",
        borderRadius: "10px",
        padding: "10px 12px",
        fontSize: "13px",
        fontWeight: 600,
    },

    /* --- Mobile Card List Styles --- */
    cardList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    mobileCard: {
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #F3F4F6",
        paddingBottom: "10px",
    },
    cardJamBadge: {
        fontSize: "12px",
        fontWeight: 700,
        color: "#1E40AF",
        background: "#E0F2FE",
        padding: "4px 8px",
        borderRadius: "6px",
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    cardSpkInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    cardSpkName: {
        fontSize: "14px",
        fontWeight: 800,
        color: "#111827",
        whiteSpace: "pre-line",
    },
    cardSpkNo: {
        fontSize: "12px",
        color: "#4B5563",
        fontWeight: 600,
        marginTop: "1px",
    },
    cardSpkMeta: {
        fontSize: "11px",
        color: "#6B7280",
        fontWeight: 700,
        marginTop: 4,
    },
    cardStatsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px",
    },
    cardStatBoxTarget: {
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    cardStatBoxRealisasi: {
        background: "#FFFBF7",
        border: "1px solid #F1E9E2",
        borderRadius: "8px",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    cardStatLabel: {
        fontSize: "10px",
        fontWeight: 700,
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    cardStatVal: {
        fontSize: "16px",
        fontWeight: 800,
    },
};
