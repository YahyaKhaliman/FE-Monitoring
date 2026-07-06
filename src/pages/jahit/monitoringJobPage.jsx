/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo, Fragment } from "react";
import {
    getMonitoring,
    getMonitoringKelompok,
    getMonitoringLini,
} from "../../services/monitoringJob.service";
import { getSpkTargets } from "../../services/spkTarget.service";
import { loadUser } from "../../utils/storage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authProvider";
import { MdArrowBack, MdRefresh } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SimpleDatePicker from "../../components/SimpleDatePicker";

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

            // Bangun map nomor SPK -> detail SPK (nama & target)
            const newSpkMap = {};
            if (spkRes?.ok && Array.isArray(spkRes.data)) {
                spkRes.data.forEach((item) => {
                    if (item.nomor) {
                        newSpkMap[String(item.nomor).trim().toUpperCase()] = {
                            nama: item.nama || "",
                            target: Number(item.target || 0),
                        };
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
                toast.success("Data monitoring berhasil dimuat");
            } else {
                setRows([]);
                setAvg(0);
                setErrorMsg(res?.message || "Gagal memuat data monitoring");
                toast.error(res?.message || "Gagal memuat data monitoring");
            }
        } catch (e) {
            setRows([]);
            setAvg(0);
            setErrorMsg(
                e?.response?.data?.message ||
                    e?.message ||
                    "Tidak bisa konek ke server monitoring",
            );
            toast.error(e?.message || "Tidak bisa konek ke server monitoring");
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

    const groupedByJam = useMemo(() => {
        const groups = {};
        rows.forEach((item) => {
            const key = item.jam || "Lainnya";
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
        });

        return Object.keys(groups)
            .sort((a, b) => {
                const na = parseInt(a, 10);
                const nb = parseInt(b, 10);
                if (!isNaN(na) && !isNaN(nb)) return na - nb;
                return a.localeCompare(b);
            })
            .map((jam) => {
                const items = groups[jam];
                const totalTarget = items.reduce(
                    (sum, item) => sum + Number(item.target || 0),
                    0,
                );
                const totalRealisasi = items.reduce(
                    (sum, item) => sum + Number(item.realisasi || 0),
                    0,
                );
                const totalPersen =
                    totalTarget > 0
                        ? Math.round((totalRealisasi / totalTarget) * 100)
                        : 0;

                return {
                    jam,
                    items,
                    totalTarget,
                    totalRealisasi,
                    totalPersen,
                };
            });
    }, [rows]);

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

    function renderSpkDetail(r, isMobileView = false) {
        const spkNos = String(r.spk || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);

        if (spkNos.length === 0) {
            return (
                <div style={{ color: "#9CA3AF", fontStyle: "italic" }}>
                    Tidak ada SPK
                </div>
            );
        }

        // Parsing nomor dan nama SPK
        const parsedSpks = spkNos.map((item) => {
            let no = item;
            let name = "-";

            if (no.includes("\n")) {
                const parts = no.split(/\r?\n/);
                no = parts[0].trim().toUpperCase();
                name = parts[1]?.trim() || "-";
            } else {
                no = no.toUpperCase();
                const spkInfo = spkMap[no];
                name = spkInfo?.nama || "-";
            }

            return { no, name };
        });

        // JIKA HANYA ADA 1 SPK
        if (parsedSpks.length === 1) {
            const { no, name } = parsedSpks[0];
            const spkInfo = spkMap[no];
            return (
                <div>
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
                            isMobileView ? styles.cardSpkNo : styles.spkNoText
                        }
                    >
                        No. SPK: {no}
                    </div>
                    <div
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#4B5563",
                            marginTop: "3px",
                        }}
                    >
                        <span>Target: {spkInfo?.target || r.target}</span>
                    </div>
                </div>
            );
        }

        // JIKA ADA BEBERAPA SPK (MULTI)
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobileView ? "10px" : "8px",
                }}
            >
                {parsedSpks.map(({ no, name }, idx) => {
                    const spkInfo = spkMap[no];
                    const targetVal = spkInfo?.target || 0;

                    return (
                        <div
                            key={idx}
                            style={{
                                borderBottom:
                                    idx < parsedSpks.length - 1
                                        ? "1px dashed #E5E7EB"
                                        : "none",
                                paddingBottom:
                                    idx < parsedSpks.length - 1 ? "8px" : "0",
                                marginTop: idx > 0 ? "6px" : "0",
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
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#4B5563",
                                    marginTop: "3px",
                                }}
                            >
                                Target: {targetVal || r.target}
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
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
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
                            MONITORING PRODUKSI HARIAN
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
                    <div style={styles.avgLabel}>PRESENTASE CAPAIAN</div>
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
                    <SimpleDatePicker
                        value={tanggal}
                        onChange={(val) => setTanggal(val)}
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
                            width: isMobile ? "100%" : "40px",
                            height: "40px",
                        }}
                        onClick={loadMonitoring}
                        disabled={loading || !lini || !kelompok}
                        title="Refresh Data"
                        onMouseOver={(e) => {
                            if (!loading && lini && kelompok) {
                                e.currentTarget.style.background = "#F3F4F6";
                                e.currentTarget.style.borderColor = "#9CA3AF";
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.borderColor = "#D1D5DB";
                        }}
                    >
                        <MdRefresh
                            size={20}
                            style={{
                                animation: loading
                                    ? "spin 1s linear infinite"
                                    : "none",
                            }}
                        />
                    </button>
                </div>
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            {/* DATA SECTION */}
            {isMobile ? (
                /* Tampilan Card khusus Mobile (Grouped By Jam) */
                <div style={styles.cardList}>
                    {groupedByJam.length === 0 ? (
                        <div style={styles.tdEmpty}>
                            Menunggu data produksi...
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                            }}
                        >
                            {groupedByJam.map((g, gIdx) => (
                                <div
                                    key={gIdx}
                                    style={styles.mobileJamGroupCard}
                                >
                                    <div style={styles.mobileJamGroupHeader}>
                                        <span
                                            style={styles.mobileJamGroupTitle}
                                        >
                                            JAM {g.jam}
                                        </span>
                                        <div
                                            style={{
                                                ...styles.percentBadge,
                                                padding: "4px 8px",
                                                fontSize: "12px",
                                                minWidth: "auto",
                                                background:
                                                    g.totalPersen >= 100
                                                        ? "#DCFCE7"
                                                        : g.totalPersen >= 80
                                                          ? "#FFF7ED"
                                                          : "#FEE2E2",
                                                color:
                                                    g.totalPersen >= 100
                                                        ? "#166534"
                                                        : g.totalPersen >= 80
                                                          ? "#9A3412"
                                                          : "#991B1B",
                                            }}
                                        >
                                            Capaian: {g.totalPersen}%
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                            marginTop: 4,
                                        }}
                                    >
                                        {g.items.map((r, i) => (
                                            <div
                                                key={i}
                                                style={styles.mobileJamItemRow}
                                            >
                                                <div style={styles.cardSpkInfo}>
                                                    {renderSpkDetail(r, true)}
                                                    <div
                                                        style={
                                                            styles.cardSpkMeta
                                                        }
                                                    >
                                                        MP: {r.mp} orang
                                                        &nbsp;•&nbsp; Total SPK:{" "}
                                                        {getSpkCount(r.spk)}
                                                    </div>
                                                </div>
                                                <div
                                                    style={styles.cardStatsGrid}
                                                >
                                                    <div
                                                        style={
                                                            styles.cardStatBoxTarget
                                                        }
                                                    >
                                                        <span
                                                            style={
                                                                styles.cardStatLabel
                                                            }
                                                        >
                                                            Target
                                                        </span>
                                                        <span
                                                            style={
                                                                styles.cardStatVal
                                                            }
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
                                                            style={
                                                                styles.cardStatLabel
                                                            }
                                                        >
                                                            Realisasi
                                                        </span>
                                                        <span
                                                            style={
                                                                styles.cardStatVal
                                                            }
                                                        >
                                                            {r.realisasi}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Tampilan Tabel untuk Tablet & Desktop (Grouped By Jam) */
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, ...styles.colSpk }}>
                                    DETAIL SPK
                                </th>
                                <th style={{ ...styles.th, ...styles.colMp }}>
                                    MAN POWER
                                </th>
                                <th
                                    style={{
                                        ...styles.thCenter,
                                        ...styles.colNum,
                                        ...styles.thTarget,
                                    }}
                                >
                                    TARGET
                                </th>
                                <th
                                    style={{
                                        ...styles.thCenter,
                                        ...styles.colNum,
                                        ...styles.thRealisasi,
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
                                    CAPAIAN
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedByJam.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={styles.tdEmpty}>
                                        Menunggu data produksi...
                                    </td>
                                </tr>
                            ) : (
                                groupedByJam.map((g, gIdx) => (
                                    <Fragment key={gIdx}>
                                        {/* Jam Group Header Row */}
                                        <tr>
                                            <td
                                                colSpan={5}
                                                style={styles.tdJamHeader}
                                            >
                                                <div
                                                    style={
                                                        styles.jamHeaderInner
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.jamHeaderLabel
                                                        }
                                                    >
                                                        JAM {g.jam}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Jam Data Rows */}
                                        {g.items.map((r, i) => (
                                            <tr
                                                key={`${gIdx}-${i}`}
                                                style={{
                                                    ...(i % 2 === 0
                                                        ? styles.trEven
                                                        : styles.trOdd),
                                                }}
                                            >
                                                <td style={styles.tdSpk}>
                                                    {renderSpkDetail(r, false)}
                                                    <div style={styles.spkMeta}>
                                                        Total SPK:{" "}
                                                        {getSpkCount(r.spk)}
                                                    </div>
                                                </td>
                                                <td style={styles.tdMp}>
                                                    <div style={styles.mpBadge}>
                                                        {r.mp}
                                                    </div>
                                                    <div style={styles.mpLabel}>
                                                        orang
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
                                                                    : r.persen >=
                                                                        80
                                                                      ? "#FFF7ED"
                                                                      : "#FEE2E2",
                                                            color:
                                                                r.persen >= 100
                                                                    ? "#166534"
                                                                    : r.persen >=
                                                                        80
                                                                      ? "#9A3412"
                                                                      : "#991B1B",
                                                        }}
                                                    >
                                                        {r.persen}%
                                                    </div>
                                                    {/* Mini Progress Bar */}
                                                    <div
                                                        style={
                                                            styles.progressBarWrap
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                ...styles.progressBarFill,
                                                                width: `${Math.min(r.persen, 100)}%`,
                                                                background:
                                                                    r.persen >=
                                                                    100
                                                                        ? "#16a34a"
                                                                        : r.persen >=
                                                                            80
                                                                          ? "#ea580c"
                                                                          : "#dc2626",
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
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
        fontFamily: "'Readex Pro', sans-serif",
    },
    select: {
        height: "40px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        padding: "0 12px",
        outline: "none",
        cursor: "pointer",
        fontFamily: "'Readex Pro', sans-serif",
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
        minWidth: "750px",
    },
    colJam: { width: "8%" },
    colMp: { width: "9%", textAlign: "center" },
    colSpk: { width: "38%" },
    colNum: { width: "12%" },
    th: {
        textAlign: "left",
        padding: "12px 16px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        fontSize: "11px",
        fontWeight: 800,
        color: "#4B5563",
        textTransform: "uppercase",
        verticalAlign: "middle",
    },
    thCenter: {
        textAlign: "center",
        padding: "12px 16px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        fontSize: "11px",
        fontWeight: 800,
        color: "#4B5563",
        textTransform: "uppercase",
    },
    thTarget: {
        padding: "10px 16px",
        background: "#FFF7ED",
        border: "1px solid #E5E7EB",
        fontSize: "11px",
        color: "#B34E33",
        fontWeight: 800,
        textAlign: "center",
    },
    thRealisasi: {
        padding: "10px 16px",
        background: "#FFF7ED",
        border: "1px solid #E5E7EB",
        fontSize: "11px",
        color: "#B34E33",
        fontWeight: 800,
        textAlign: "center",
    },

    td: { padding: "12px 16px", borderBottom: "1px solid #F3F4F6" },
    tdJam: {
        padding: "12px 16px",
        borderBottom: "1px solid #F3F4F6",
        fontWeight: 800,
        color: "#1E40AF",
        background: "#F0F7FF",
        fontSize: "15px",
    },
    /* Kolom JAM dengan rowSpan */
    tdJamCell: {
        padding: "0",
        textAlign: "center",
        verticalAlign: "middle",
        background: "#F0F7FF",
        borderRight: "1px solid #DBEAFE",
        borderBottom: "1px solid #F3F4F6",
        width: "8%",
    },
    tdJamCellInner: {
        fontWeight: 800,
        fontSize: "15px",
        color: "#1E40AF",
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0",
        lineHeight: 1,
    },
    tdMp: {
        padding: "14px 12px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        verticalAlign: "middle",
        fontWeight: 700,
        fontSize: "14px",
        color: "#374151",
    },
    mpBadge: {
        fontSize: "15px",
        fontWeight: 700,
        color: "#374151",
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1,
    },
    mpLabel: {
        fontSize: "10px",
        color: "#9CA3AF",
        fontWeight: 600,
        textTransform: "uppercase",
        marginTop: "2px",
    },
    tdSpk: {
        padding: "12px 16px",
        borderBottom: "1px solid #F3F4F6",
        whiteSpace: "pre-line",
        fontSize: "14px",
        fontWeight: 500,
        color: "#374151",
        verticalAlign: "middle",
    },
    spkMeta: {
        marginTop: "6px",
        fontSize: "10px",
        fontWeight: 700,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontFamily: "'Inter', sans-serif",
        borderTop: "1px dashed #E5E7EB",
        paddingTop: "4px",
    },
    spkNameText: {
        fontSize: "14px",
        fontWeight: 800,
        color: "#111827",
    },
    spkNoText: {
        fontSize: "12px",
        color: "#6B7280",
        fontWeight: 600,
        marginTop: "2px",
        fontFamily: "'Inter', sans-serif",
    },
    tdTarget: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontWeight: 700,
        color: "#4B5563",
        background: "#F9FAFB",
        verticalAlign: "middle",
    },
    tdRealisasi: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: 800,
        color: "#B34E33",
        fontFamily: "'Inter', sans-serif",
        verticalAlign: "middle",
    },
    tdCenter: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontSize: "14px",
        color: "#374151",
        verticalAlign: "middle",
    },

    percentBadge: {
        padding: "5px 10px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 800,
        textAlign: "center",
        display: "inline-block",
        minWidth: "54px",
        fontFamily: "'Inter', sans-serif",
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
        width: 40,
        height: 40,
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        background: "#fff",
        color: "#374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        outline: "none",
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
        fontFamily: "'Inter', sans-serif",
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
        fontFamily: "'Inter', sans-serif",
    },

    /* --- Desktop Table Header Jam --- */
    tdJamHeader: {
        padding: "10px 16px",
        background: "#EFF6FF",
        borderTop: "2px solid #DBEAFE",
        borderBottom: "2px solid #DBEAFE",
        fontSize: "13px",
        fontWeight: 800,
        color: "#1E40AF",
    },
    jamHeaderInner: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    jamHeaderLabel: {
        fontSize: "13px",
        fontWeight: 800,
        color: "#1E40AF",
    },
    jamHeaderBadges: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        fontSize: "11px",
        fontWeight: 800,
    },
    jamBadgeTarget: {
        fontSize: "11px",
        fontWeight: 800,
    },
    jamBadgeRealisasi: {
        fontSize: "11px",
        fontWeight: 800,
    },
    jamBadgeCapaian: {
        fontSize: "11px",
        fontWeight: 800,
        padding: "2px 8px",
        borderRadius: "6px",
    },

    /* --- Mobile Group Jam Card Styles --- */
    mobileJamGroupCard: {
        background: "#ffffff",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    mobileJamGroupHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2px solid #EFF6FF",
        paddingBottom: "8px",
    },
    mobileJamGroupTitle: {
        fontSize: "14px",
        fontWeight: 800,
        color: "#1E40AF",
    },
    mobileJamGroupStatsSummary: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "11px",
        color: "#4B5563",
        fontWeight: 600,
        background: "#F3F4F6",
        padding: "6px 12px",
        borderRadius: "8px",
    },
    mobileJamItemRow: {
        borderBottom: "1px solid #F3F4F6",
        paddingBottom: "12px",
        marginBottom: "4px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
};
