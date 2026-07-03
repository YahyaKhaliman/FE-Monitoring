/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo, Fragment } from "react";
import {
    getRealisasi,
    getJamOptions,
    saveRealisasi,
} from "../../services/realisasi.service";
import { cariSpkTarget, getSpkTargets } from "../../services/spkTarget.service";
import { getManPower } from "../../services/manPower.service";
import { loadUser } from "../../utils/storage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdSearch, MdArrowBack } from "react-icons/md";
import { SkeletonTable } from "../../components/Skeleton";
import { formatDate } from "../../utils/date";

export default function RealisasiJobPage() {
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const isMobile = windowWidth <= 600;

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const user = useMemo(() => loadUser(), []);
    const isAdmin = ["ADMIN", "IT"].includes(
        (user?.user_bagian || "").toUpperCase(),
    );
    const kelompokOptions = [
        "LINE A",
        "LINE B",
        "LINE C",
        "LINE D",
        "LINE E",
        "LINE F",
        "LINE G",
        "LINE H",
        "LINE I",
        "LINE J",
        "LINE K",
    ];

    // --- States ---
    const [tanggal, setTanggal] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [lini, setLini] = useState(
        isAdmin ? "JAHIT" : user?.user_bagian || "JAHIT",
    );
    const [kelompok, setKelompok] = useState(
        isAdmin ? "" : user?.user_kelompok || "",
    );
    const [data, setData] = useState([]);
    const [jamOptions, setJamOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchingSpk, setSearchingSpk] = useState(false);
    const [loadingSpkList, setLoadingSpkList] = useState(false);
    const [deviceNow, setDeviceNow] = useState(() => new Date());
    const [openForm, setOpenForm] = useState(false);
    const [openSpkSearch, setOpenSpkSearch] = useState(false);
    const [spkKeyword, setSpkKeyword] = useState("");
    const [spkListSource, setSpkListSource] = useState([]);
    const [form, setForm] = useState({
        tanggal: new Date().toISOString().slice(0, 10),
        lini: isAdmin ? "JAHIT" : user?.user_bagian || "JAHIT",
        kelompok: isAdmin ? "" : user?.user_kelompok || "",
        jam: "",
        spk: "",
        nama: "",
        target: "",
        realisasi: "",
        mp: "",
    });

    const userLabel = useMemo(() => {
        if (!user) return "";
        return `${user.user_nama || ""} • ${user.user_cab || ""} ${user.user_bagian || ""}`.trim();
    }, [user]);

    const jamNeedInput = useMemo(() => {
        if (!form.tanggal || !form.lini || !form.kelompok) return [];
        const normalize = (v) =>
            String(v || "")
                .trim()
                .toUpperCase();
        return jamOptions.map((j) => {
            const jam = j.jam;
            const exists = data.some(
                (d) =>
                    String(d.tanggal || "") === form.tanggal &&
                    normalize(d.lini) === normalize(form.lini) &&
                    normalize(d.kelompok) === normalize(form.kelompok) &&
                    String(d.jam || "") === String(jam),
            );
            return { jam, filled: exists };
        });
    }, [jamOptions, data, form.tanggal, form.lini, form.kelompok]);

    const jamOptionWithStatus = useMemo(() => {
        const today = deviceNow.toISOString().slice(0, 10);

        const getEndHour = (jamRange) => {
            const value = String(jamRange || "");
            const normalized = value.replace(/\s/g, "").replace(/\./g, ":");
            const parts = normalized.split("-");
            if (parts.length < 2) return null;
            const endPart = parts[1] || "";
            const match = endPart.match(/(\d{1,2})/);
            if (!match) return null;
            const end = Number(match[1]);
            return Number.isNaN(end) ? null : end;
        };

        return jamNeedInput.map((j) => {
            const endHour = getEndHour(j.jam);
            const passedByTime =
                form.tanggal === today &&
                endHour !== null &&
                deviceNow.getHours() >= endHour;
            return {
                ...j,
                disabled: j.filled || passedByTime,
                reason: j.filled
                    ? "Sudah diinput"
                    : passedByTime
                      ? "Jam sudah lewat"
                      : "",
            };
        });
    }, [jamNeedInput, form.tanggal, deviceNow]);

    const spkListFiltered = useMemo(() => {
        const keyword = String(spkKeyword || "")
            .trim()
            .toUpperCase();
        if (!keyword) return spkListSource;

        return spkListSource.filter((row) => {
            const nomor = String(row.nomor || "").toUpperCase();
            const nama = String(row.nama || "").toUpperCase();
            return nomor.includes(keyword) || nama.includes(keyword);
        });
    }, [spkListSource, spkKeyword]);

    const groupedByJam = useMemo(() => {
        const groups = {};
        data.forEach((item) => {
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
                const totalTarget = items.reduce((sum, item) => sum + Number(item.mr_target || 0), 0);
                const totalRealisasi = items.reduce((sum, item) => sum + Number(item.mr_realisasi || 0), 0);
                return {
                    jam,
                    items,
                    totalTarget,
                    totalRealisasi,
                };
            });
    }, [data]);

    const parseTimestamp = (value) => {
        const t = new Date(value || 0).getTime();
        return Number.isFinite(t) ? t : 0;
    };

    const sortByLatestTanggal = (rows) => {
        return [...rows].sort((a, b) => {
            const ta = parseTimestamp(a.tanggal);
            const tb = parseTimestamp(b.tanggal);
            if (tb !== ta) return tb - ta;
            return String(a.nomor || "").localeCompare(String(b.nomor || ""));
        });
    };

    // --- Data Loading ---
    const refreshData = async () => {
        setLoading(true);
        try {
            const res = await getRealisasi({
                cab: user.user_cab,
                tanggal,
                lini: isAdmin ? lini : user.user_bagian,
                kelompok: isAdmin
                    ? kelompok
                        ? String(kelompok).toUpperCase()
                        : undefined
                    : user.user_kelompok,
            });

            if (!res?.ok) {
                setData([]);
                throw new Error(res?.message || "Gagal memuat data");
            }
            setData(res.data || []);
            return res;
        } finally {
            setLoading(false);
        }
    };

    const loadJam = async () => {
        try {
            const res = await getJamOptions();
            if (res?.ok) {
                setJamOptions(res.data || []);
            }
        } catch {
            setJamOptions([]);
        }
    };

    const openAddForm = () => {
        setForm({
            tanggal,
            lini: isAdmin ? lini : user?.user_bagian || "JAHIT",
            kelompok: isAdmin ? kelompok || "" : user?.user_kelompok || "",
            jam: jamOptions[0]?.jam || "",
            spk: "",
            nama: "",
            target: "",
            realisasi: "",
            mp: "",
        });
        setOpenForm(true);
    };

    const loadSpkListForModal = async () => {
        const cab = String(user?.user_cab || "").trim();
        const liniAktif = String(
            form.lini || (isAdmin ? lini : user?.user_bagian || "JAHIT"),
        )
            .trim()
            .toUpperCase();

        if (!cab) {
            toast.error("Cabang user login tidak tersedia");
            return;
        }
        if (!liniAktif) {
            toast.warning("Pilih lini terlebih dahulu");
            return;
        }

        setLoadingSpkList(true);
        try {
            const res = await getSpkTargets(cab, liniAktif);
            if (!res?.ok) {
                setSpkListSource([]);
                toast.error(res?.message || "Gagal memuat data SPK");
                return;
            }

            const mapped = (Array.isArray(res?.data) ? res.data : []).map(
                (r) => ({
                    nomor: String(r.nomor || "").toUpperCase(),
                    nama: String(r.nama || ""),
                    target: Number(r.target || 0),
                    tanggal:
                        r.tanggal || r.date_create || r.date_modified || null,
                }),
            );

            setSpkListSource(sortByLatestTanggal(mapped));
        } catch {
            setSpkListSource([]);
            toast.error("Gagal memuat data SPK");
        } finally {
            setLoadingSpkList(false);
        }
    };

    const openSpkSearchModal = async () => {
        setSpkKeyword("");
        setOpenSpkSearch(true);
        await loadSpkListForModal();
    };

    const selectSpkFromModal = (row) => {
        setForm((p) => ({
            ...p,
            spk: String(row?.nomor || "").toUpperCase(),
            nama: String(row?.nama || ""),
            target: String(row?.target || ""),
        }));
        setOpenSpkSearch(false);
        toast.success("SPK dipilih dari daftar");
    };

    const onCariSpk = async () => {
        if (!form.spk.trim()) {
            toast.warning("Masukkan nomor SPK terlebih dahulu");
            return;
        }
        setSearchingSpk(true);
        try {
            const res = await cariSpkTarget(form.spk.trim());
            if (res?.ok && res?.data) {
                const isClosed = Number(res.data.spk_close) === 1;
                if (isClosed) {
                    setForm((p) => ({ ...p, nama: "" }));
                    toast.error("SPK sudah CLOSE");
                    return;
                }
                setForm((p) => ({
                    ...p,
                    nama: res.data.spk_nama || "",
                    target: p.target || String(res.data.target_per_jam || ""),
                }));
                toast.success("SPK valid");
            } else {
                setForm((p) => ({ ...p, nama: "" }));
                toast.error("SPK tidak ditemukan");
            }
        } catch {
            setForm((p) => ({ ...p, nama: "" }));
            toast.error("Gagal validasi SPK");
        } finally {
            setSearchingSpk(false);
        }
    };

    const onSave = async (e) => {
        e.preventDefault();
        if (
            !form.tanggal ||
            !form.lini ||
            !form.kelompok ||
            !form.jam ||
            !form.spk ||
            !form.nama
        ) {
            toast.warning(
                "Lengkapi Tanggal, Lini, Kelompok, Jam, lalu validasi SPK",
            );
            return;
        }
        setSaving(true);
        try {
            const res = await saveRealisasi({
                tanggal: form.tanggal,
                cab: user?.user_cab,
                lini: form.lini,
                kelompok: form.kelompok,
                jam: form.jam,
                spk: form.spk,
                realisasi: Number(form.realisasi || 0),
                target: Number(form.target || 0),
                mp: Number(form.mp || 0),
                user: user?.user_kode,
                edit_mode: false,
            });
            if (!res?.ok) {
                toast.error(res?.message || "Gagal simpan realisasi");
                return;
            }
            toast.success("Realisasi berhasil disimpan");
            setOpenForm(false);
            await refreshData();
        } catch {
            toast.error("Gagal simpan realisasi");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (user?.user_cab) refreshData();
    }, [tanggal, lini, kelompok]);

    useEffect(() => {
        loadJam();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setDeviceNow(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!openForm) return;
        if (!form.tanggal || !form.lini || !form.kelompok) return;

        const loadMpFromManPower = async () => {
            try {
                const res = await getManPower({
                    cab: user?.user_cab,
                    tanggal: form.tanggal,
                    lini: form.lini,
                    kelompok: form.kelompok,
                });
                const found = Array.isArray(res?.data)
                    ? res.data.find(
                          (r) =>
                              String(r.kelompok || "").toUpperCase() ===
                              String(form.kelompok || "").toUpperCase(),
                      )
                    : null;
                if (found && Number(found.mp) > 0) {
                    setForm((p) => ({ ...p, mp: String(found.mp) }));
                }
            } catch {
                // biarkan MP tetap bisa diisi manual
            }
        };

        loadMpFromManPower();
    }, [openForm, form.tanggal, form.lini, form.kelompok]);

    return (
        <div style={{
            ...styles.page,
            padding: isMobile ? "12px" : "32px 20px",
        }}>
            {/* HEADER */}
            <div style={{
                ...styles.header,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: isMobile ? "16px" : "12px",
                padding: isMobile ? "16px" : "20px 24px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        style={styles.btnBack}
                        onClick={() => navigate("/menu")}
                        aria-label="Kembali"
                    >
                        <MdArrowBack size={20} />
                    </button>
                    <div>
                        <div style={styles.title}>REALISASI JOB PRODUKSI</div>
                        <div style={styles.sub}>{userLabel}</div>
                    </div>
                </div>
                <div style={{
                    display: "flex",
                    gap: 8,
                    width: isMobile ? "100%" : "auto",
                    justifyContent: isMobile ? "stretch" : "flex-end"
                }}>
                    <button
                        style={{
                            ...styles.btnSecondary,
                            flex: isMobile ? 1 : "none",
                            height: "44px",
                        }}
                        onClick={() =>
                            toast.promise(refreshData(), {
                                pending: "Memuat realisasi...",
                                success: "Data diperbarui",
                                error: "Gagal sinkronisasi",
                            })
                        }
                        disabled={loading}
                    >
                        {loading ? "..." : "Refresh"}
                    </button>
                    <button
                        style={{
                            ...styles.btnPrimary,
                            flex: isMobile ? 1 : "none",
                            height: "44px",
                            opacity: 1,
                            cursor: "pointer",
                        }}
                        onClick={openAddForm}
                        disabled={false}
                        title="Tambah realisasi"
                    >
                        + Tambah Realisasi
                    </button>
                </div>
            </div>

            {/* FILTERS PANEL */}
            <div style={{
                ...styles.filters,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "end",
                gap: isMobile ? 16 : 12,
                padding: isMobile ? "16px" : "16px 20px",
            }}>
                <div style={{ ...styles.filterGroup, width: "100%" }}>
                    <label style={styles.label}>Tanggal</label>
                    <input
                        type="date"
                        style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                    />
                </div>

                {isAdmin && (
                    <>
                        <div style={{ ...styles.filterGroup, width: "100%" }}>
                            <label style={styles.label}>Lini Produksi</label>
                            <select
                                style={{ ...styles.select, width: "100%", boxSizing: "border-box", height: 40 }}
                                value={lini}
                                onChange={(e) => setLini(e.target.value)}
                            >
                                <option value="JAHIT">JAHIT</option>
                                <option value="CUTTING">CUTTING</option>
                                <option value="FINISHING">FINISHING</option>
                            </select>
                        </div>
                        <div style={{ ...styles.filterGroup, width: "100%" }}>
                            <label style={styles.label}>Kelompok</label>
                            <select
                                style={{ ...styles.select, width: "100%", boxSizing: "border-box", height: 40 }}
                                value={kelompok}
                                onChange={(e) => setKelompok(e.target.value)}
                            >
                                <option value="">Semua Kelompok</option>
                                {kelompokOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                {!isAdmin && (
                    <div style={{ ...styles.filterGroup, width: "100%" }}>
                        <label style={styles.label}>Kelompok</label>
                        <input
                            style={{
                                ...styles.input,
                                width: "100%",
                                boxSizing: "border-box",
                                backgroundColor: "#F3F4F6",
                            }}
                            value={user.user_kelompok}
                            disabled
                        />
                    </div>
                )}
            </div>

            {/* DATA SECTION */}
            {isMobile ? (
                /* Tampilan Card untuk Mobile */
                <div style={styles.cardList}>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[1, 2, 3].map((n) => (
                                <div key={n} style={styles.mobileCard}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                        <div className="skeleton" style={{ width: "100px", height: "20px", borderRadius: "4px" }} />
                                        <div className="skeleton" style={{ width: "60px", height: "16px", borderRadius: "4px" }} />
                                    </div>
                                    <div className="skeleton" style={{ width: "100%", height: "24px", borderRadius: "4px", marginBottom: 8 }} />
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <div className="skeleton" style={{ flex: 1, height: "32px", borderRadius: "8px" }} />
                                        <div className="skeleton" style={{ flex: 1, height: "32px", borderRadius: "8px" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : groupedByJam.length === 0 ? (
                        <div style={styles.empty}>Tidak ada data realisasi di kelompok ini</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {groupedByJam.map((g, idx) => (
                                <div key={idx} style={styles.mobileCard}>
                                    <div style={styles.cardHeader}>
                                        <span style={styles.cardJamBadge}>Jam {g.jam}</span>
                                        <span style={{ fontSize: "11px", color: "#2563EB", fontWeight: 800, background: "#EFF6FF", padding: "4px 8px", borderRadius: "6px" }}>
                                            T: {g.totalTarget} • R: {g.totalRealisasi}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        {g.items.map((d, i) => (
                                            <div key={i} style={{
                                                paddingTop: i > 0 ? 12 : 0,
                                                borderTop: i > 0 ? "1px solid #F3F4F6" : "none",
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                                                    <div style={styles.cardSpkInfo}>
                                                        <div style={styles.cardSpkName}>{d.spk_nama}</div>
                                                        <div style={styles.cardSpkDate}>{d.lini} • {d.kelompok}</div>
                                                    </div>
                                                </div>
                                                <div style={styles.cardStatsGrid}>
                                                    <div style={styles.cardStatBoxTarget}>
                                                        <span style={styles.cardStatLabel}>Target</span>
                                                        <span style={styles.cardStatVal}>{d.mr_target}</span>
                                                    </div>
                                                    <div style={styles.cardStatBoxRealisasi}>
                                                        <span style={styles.cardStatLabel}>Realisasi</span>
                                                        <span style={styles.cardStatVal}>{d.mr_realisasi}</span>
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
                /* Tampilan Tabel untuk Tablet & Desktop */
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Identitas Barang / SPK</th>
                                <th style={styles.thHighlight}>Target</th>
                                <th style={styles.thHighlight}>Realisasi</th>
                                <th style={styles.thCenter}>Kelompok</th>
                                <th style={styles.thCenter}>Lini</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <SkeletonTable cols={5} rows={5} />
                            ) : groupedByJam.length === 0 ? (
                                <tr>
                                    <td style={styles.tdEmpty} colSpan={5}>
                                        Tidak ada data realisasi di kelompok ini
                                    </td>
                                </tr>
                            ) : (
                                groupedByJam.map((g, gIdx) => (
                                    <Fragment key={gIdx}>
                                        {/* Baris Pemisah Jam */}
                                        <tr>
                                            <td colSpan={5} style={styles.tdJamHeader}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontWeight: 800 }}>⏰ JAM {g.jam}</span>
                                                    <span style={{ fontSize: "11px", fontWeight: 800 }}>
                                                        TOTAL TARGET: {g.totalTarget} &nbsp;•&nbsp; TOTAL REALISASI: {g.totalRealisasi}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {g.items.map((d, i) => (
                                            <tr
                                                key={`${gIdx}-${i}`}
                                                style={
                                                    i % 2 === 0
                                                        ? styles.trEven
                                                        : styles.trOdd
                                                }
                                            >
                                                <td style={styles.td}>
                                                    <div style={styles.spkName}>
                                                        {d.spk_nama}
                                                    </div>
                                                    <div style={styles.spkDate}>
                                                        {formatDate(d.tanggal)}
                                                    </div>
                                                </td>
                                                <td style={styles.tdTarget}>
                                                    {d.mr_target}
                                                </td>
                                                <td style={styles.tdRealisasi}>
                                                    {d.mr_realisasi}
                                                </td>
                                                <td style={styles.tdCenter}>
                                                    {d.kelompok}
                                                </td>
                                                <td style={styles.tdCenter}>{d.lini}</td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL FORM */}
            {openForm && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => setOpenForm(false)}
                >
                    <div
                        style={{
                            ...styles.modal,
                            width: isMobile ? "94%" : "min(700px, 95vw)",
                            padding: isMobile ? "16px" : "24px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <div>
                                <div style={styles.modalTitle}>
                                    Tambah Realisasi
                                </div>
                                <div style={styles.modalSub}>
                                    Lengkapi data realisasi per jam untuk hari
                                    ini
                                </div>
                            </div>
                            <button
                                style={styles.btnCloseModal}
                                onClick={() => setOpenForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        {/* Jam Guide Section */}
                        <div style={styles.jamGuideWrap}>
                            {jamNeedInput.map((j) => (
                                <div
                                    key={j.jam}
                                    style={{
                                        ...styles.jamGuideItem,
                                        background: j.filled
                                            ? "#DCFCE7"
                                            : "#FEE2E2",
                                        color: j.filled ? "#166534" : "#991B1B",
                                        border: `1px solid ${j.filled ? "#BBF7D0" : "#FECACA"}`,
                                    }}
                                >
                                    {j.jam} • {j.filled ? "Lengkap" : "Belum"}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={onSave}>
                            <div style={{
                                ...styles.formGrid,
                                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                            }}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tanggal</label>
                                    <input
                                        type="date"
                                        style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                                        value={form.tanggal}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                tanggal: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Lini Produksi
                                    </label>
                                    <select
                                        style={{ ...styles.select, width: "100%", boxSizing: "border-box", height: 40 }}
                                        value={form.lini}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                lini: e.target.value,
                                            }))
                                        }
                                        disabled={!isAdmin}
                                    >
                                        <option value="JAHIT">JAHIT</option>
                                        <option value="CUTTING">CUTTING</option>
                                        <option value="FINISHING">
                                            FINISHING
                                        </option>
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Kelompok</label>
                                    <select
                                        style={{ ...styles.select, width: "100%", boxSizing: "border-box", height: 40 }}
                                        value={form.kelompok}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                kelompok: e.target.value,
                                            }))
                                        }
                                        disabled={!isAdmin}
                                    >
                                        <option value="">
                                            {user?.user_kelompok
                                                ? `${user.user_kelompok}`
                                                : "Pilih Kelompok"}
                                        </option>
                                        {kelompokOptions.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Jam Produksi
                                    </label>
                                    <select
                                        style={{ ...styles.select, width: "100%", boxSizing: "border-box", height: 40 }}
                                        value={form.jam}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                jam: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">Pilih Jam</option>
                                        {jamOptionWithStatus.map((j) => (
                                            <option
                                                key={j.jam}
                                                value={j.jam}
                                                disabled={j.disabled}
                                            >
                                                {j.jam}{" "}
                                                {j.reason
                                                    ? `(${j.reason})`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nomor SPK Field dengan Style Baru */}
                                <div style={{
                                    ...styles.formGroupFull,
                                    gridColumn: isMobile ? "span 1" : "span 2",
                                }}>
                                    <label style={styles.label}>
                                        Nomor SPK
                                    </label>
                                    <div style={{
                                        ...styles.inputWithButton,
                                        flexDirection: isMobile ? "column" : "row",
                                        gap: isMobile ? "8px" : "4px",
                                    }}>
                                        <input
                                            style={{
                                                ...styles.input,
                                                width: "100%",
                                                boxSizing: "border-box",
                                                textTransform: "uppercase",
                                            }}
                                            value={form.spk}
                                            onChange={(e) =>
                                                setForm((p) => ({
                                                    ...p,
                                                    spk: e.target.value.toUpperCase(),
                                                    nama: "",
                                                }))
                                            }
                                            placeholder="Contoh: JA-KO-001"
                                        />
                                        <div style={{
                                            display: "flex",
                                            gap: "4px",
                                            width: isMobile ? "100%" : "auto",
                                            height: "42px",
                                        }}>
                                            <button
                                                type="button"
                                                style={{
                                                    ...styles.btnCariSpkModal,
                                                    flex: isMobile ? 1 : "none",
                                                    height: "100%",
                                                }}
                                                onClick={openSpkSearchModal}
                                                title="Cari SPK berdasarkan nomor atau nama"
                                            >
                                                Cari SPK
                                            </button>
                                            <button
                                                type="button"
                                                style={{
                                                    ...styles.btnCariSpk,
                                                    width: isMobile ? "60px" : "50px",
                                                    height: "100%",
                                                }}
                                                onClick={onCariSpk}
                                                disabled={searchingSpk || !form.spk}
                                                title="Klik untuk validasi SPK"
                                            >
                                                {searchingSpk ? (
                                                    "..."
                                                ) : (
                                                    <MdSearch size={22} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            ...styles.spkResultText,
                                            color: form.nama
                                                ? "#059669"
                                                : "#B34E33",
                                        }}
                                    >
                                        {form.nama
                                            ? `✅ ${form.nama}`
                                            : "⚠️ Nama barang otomatis muncul setelah cari"}
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Target</label>
                                    <input
                                        type="number"
                                        style={styles.input}
                                        value={form.target}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                target: e.target.value,
                                            }))
                                        }
                                        placeholder="0"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Hasil Realisasi
                                    </label>
                                    <input
                                        type="number"
                                        style={{
                                            ...styles.input,
                                            borderColor: "#B34E33",
                                            borderWidth: "2px",
                                        }}
                                        value={form.realisasi}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                realisasi: e.target.value,
                                            }))
                                        }
                                        placeholder="0"
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Man Power (MP)
                                    </label>
                                    <input
                                        type="number"
                                        style={styles.input}
                                        value={form.mp}
                                        onChange={(e) =>
                                            setForm((p) => ({
                                                ...p,
                                                mp: e.target.value,
                                            }))
                                        }
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div style={styles.formActions}>
                                <button
                                    type="button"
                                    style={styles.btnSecondary}
                                    onClick={() => setOpenForm(false)}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    style={styles.btnPrimary}
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Menyimpan..."
                                        : "Simpan Realisasi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {openForm && openSpkSearch && (
                <div
                    style={styles.modalOverlayInner}
                    onClick={() => setOpenSpkSearch(false)}
                >
                    <div
                        style={styles.modalSearch}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <div>
                                <div style={styles.modalTitle}>Cari SPK</div>
                                <div style={styles.modalSub}>
                                    Cari berdasarkan nomor atau nama SPK
                                </div>
                            </div>
                            <button
                                style={styles.btnCloseModal}
                                onClick={() => setOpenSpkSearch(false)}
                            >
                                ×
                            </button>
                        </div>

                        <input
                            style={styles.input}
                            placeholder="Cari..."
                            value={spkKeyword}
                            onChange={(e) =>
                                setSpkKeyword(e.target.value.toUpperCase())
                            }
                        />

                        <div style={styles.searchTableWrap}>
                            <table style={styles.searchTable}>
                                <thead>
                                    <tr>
                                        <th style={styles.searchTh}>Nomor</th>
                                        <th style={styles.searchTh}>Nama</th>
                                        <th style={styles.searchThCenter}>
                                            Target/Jam
                                        </th>
                                        <th style={styles.searchThCenter}>
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingSpkList ? (
                                        <tr>
                                            <td
                                                style={styles.searchTdEmpty}
                                                colSpan={4}
                                            >
                                                Memuat data SPK...
                                            </td>
                                        </tr>
                                    ) : spkListFiltered.length === 0 ? (
                                        <tr>
                                            <td
                                                style={styles.searchTdEmpty}
                                                colSpan={4}
                                            >
                                                Data SPK tidak ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        spkListFiltered.map((row, idx) => (
                                            <tr key={`${row.nomor}-${idx}`}>
                                                <td style={styles.searchTdNo}>
                                                    {row.nomor}
                                                </td>
                                                <td style={styles.searchTd}>
                                                    {row.nama || "-"}
                                                </td>
                                                <td
                                                    style={
                                                        styles.searchTdCenter
                                                    }
                                                >
                                                    {row.target}
                                                </td>
                                                <td
                                                    style={
                                                        styles.searchTdCenter
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.btnPilihSpk
                                                        }
                                                        onClick={() =>
                                                            selectSpkFromModal(
                                                                row,
                                                            )
                                                        }
                                                    >
                                                        Pilih
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "32px 20px",
        fontFamily: "'Readex Pro', sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        background: "#fff",
        padding: "20px 24px",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        marginBottom: 24,
    },
    title: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" },
    sub: { marginTop: 4, fontSize: 12, color: "#6B7280", fontWeight: 500 },

    filters: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: 16,
        alignItems: "flex-end",
    },
    filterGroup: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
    label: {
        fontSize: 10,
        fontWeight: 800,
        color: "#374151",
        textTransform: "uppercase",
        fontFamily: "inherit",
    },
    input: {
        height: 40,
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        padding: "0 12px",
        outline: "none",
        fontSize: 14,
        fontFamily: "inherit",
    },
    select: {
        height: 40,
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        padding: "0 12px",
        outline: "none",
        cursor: "pointer",
    },

    tableWrap: {
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    table: { width: "100%", borderCollapse: "collapse", minWidth: "650px" },
    th: {
        padding: "12px 16px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        fontSize: "11px",
        fontWeight: 800,
        color: "#4B5563",
        textTransform: "uppercase",
        textAlign: "left",
        verticalAlign: "middle",
    },
    thHighlight: {
        padding: "10px",
        background: "#FFF7ED",
        border: "1px solid #E5E7EB",
        fontSize: "11px",
        color: "#B34E33",
        fontWeight: 800,
        textAlign: "center",
    },
    thSub: {
        padding: "8px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        fontSize: "10px",
        fontWeight: 800,
        textAlign: "center",
        color: "#6B7280",
    },
    thCenter: {
        textAlign: "center",
        padding: "12px 16px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        fontSize: "11px",
        fontWeight: 800,
        textTransform: "uppercase",
        color: "#4B5563",
    },

    td: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: 14,
    },
    tdJam: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: 13,
        fontWeight: 700,
        color: "#1E40AF",
        background: "#F0F7FF",
    },
    tdTarget: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontWeight: 700,
        color: "#4B5563",
        background: "#F9FAFB",
    },
    tdRealisasi: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontWeight: 800,
        color: "#B34E33",
        fontSize: 16,
        fontFamily: "'Inter', sans-serif",
    },
    tdCenter: {
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontSize: 13,
    },
    tdJamHeader: {
        padding: "10px 16px",
        background: "#EFF6FF",
        borderTop: "2px solid #DBEAFE",
        borderBottom: "2px solid #DBEAFE",
        fontSize: 13,
        fontWeight: 800,
        color: "#1E40AF",
    },
    empty: {
        padding: "40px",
        textAlign: "center",
        color: "#9CA3AF",
        fontStyle: "italic",
    },
    spkName: { fontWeight: 800, color: "#111827", fontSize: "14px" },
    spkDate: { fontSize: "11px", color: "#9CA3AF", marginTop: 2 },

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
    btnSecondary: {
        height: 38,
        padding: "0 16px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        background: "#fff",
        color: "#374151",
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    },
    btnPrimary: {
        height: 38,
        padding: "0 16px",
        borderRadius: 8,
        border: "none",
        background: "#B34E33",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: { fontSize: 18, fontWeight: 800, color: "#111827" },
    modalSub: {
        marginTop: 4,
        marginBottom: 12,
        fontSize: 12,
        color: "#6B7280",
    },
    formActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 18,
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
    },
    modal: {
        width: "min(700px, 95vw)",
        maxHeight: "90vh",
        background: "#fff",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflowY: "auto",
        boxSizing: "border-box",
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "16px",
    },
    btnCloseModal: {
        background: "none",
        border: "none",
        fontSize: "28px",
        color: "#9CA3AF",
        cursor: "pointer",
        lineHeight: 1,
    },
    jamGuideWrap: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "12px",
        background: "#F9FAFB",
        borderRadius: "12px",
        marginBottom: "20px",
    },
    jamGuideItem: {
        padding: "4px 10px",
        borderRadius: "8px",
        fontSize: "10px",
        fontWeight: 800,
        textTransform: "uppercase",
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
    },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    formGroupFull: {
        gridColumn: "span 2",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    inputWithButton: {
        display: "flex",
        gap: "4px",
        alignItems: "stretch",
    },
    btnCariSpkModal: {
        padding: "0 12px",
        borderRadius: "8px",
        border: "1px solid #C7D2FE",
        background: "#e9a144",
        color: "#303031",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
    },
    btnCariSpk: {
        width: "50px",
        borderRadius: "8px",
        border: "1px solid #D1D5DB",
        background: "#F3F4F6",
        color: "#374151",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
    },
    spkResultText: {
        marginTop: "2px",
        fontSize: "12px",
        fontWeight: 600,
        fontStyle: "italic",
    },
    modalOverlayInner: {
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 1010,
    },
    modalSearch: {
        width: "min(980px, 96vw)",
        maxHeight: "88vh",
        background: "#fff",
        borderRadius: "16px",
        padding: "18px",
        boxShadow: "0 20px 35px rgba(0,0,0,0.2)",
        overflow: "auto",
        border: "1px solid #E5E7EB",
        boxSizing: "border-box",
    },
    searchTableWrap: {
        marginTop: 12,
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
    },
    searchTable: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "500px",
    },
    searchTh: {
        textAlign: "left",
        padding: "10px 12px",
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        fontSize: 11,
        textTransform: "uppercase",
        color: "#4B5563",
    },
    searchThCenter: {
        textAlign: "center",
        padding: "10px 12px",
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        fontSize: 11,
        textTransform: "uppercase",
        color: "#4B5563",
    },
    searchTd: {
        padding: "10px 12px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: 13,
        color: "#111827",
    },
    searchTdNo: {
        padding: "10px 12px",
        borderBottom: "1px solid #F3F4F6",
        fontSize: 13,
        color: "#0F172A",
        fontWeight: 700,
    },
    searchTdCenter: {
        padding: "10px 12px",
        borderBottom: "1px solid #F3F4F6",
        textAlign: "center",
        fontSize: 13,
    },
    searchTdEmpty: {
        padding: "20px 12px",
        textAlign: "center",
        color: "#6B7280",
        fontSize: 13,
    },
    btnPilihSpk: {
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        background: "#FFFFFF",
        color: "#111827",
        fontWeight: 700,
        cursor: "pointer",
        minHeight: "36px",
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
    cardLiniBadge: {
        fontSize: "12px",
        fontWeight: 600,
        color: "#4B5563",
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
    },
    cardSpkDate: {
        fontSize: "11px",
        color: "#9CA3AF",
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
