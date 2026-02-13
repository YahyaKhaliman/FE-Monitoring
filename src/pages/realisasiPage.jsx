/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from "react";
import {
    getRealisasi,
    getJamOptions,
    saveRealisasi,
} from "../services/realisasi.service";
import { cariSpkTarget } from "../services/spkTarget.service";
import { getManPower } from "../services/manPower.service";
import { loadUser } from "../utils/storage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdSearch } from "react-icons/md";

function formatDateDDMMYYYY(dateStr) {
    if (!dateStr) return "-";
    const dateOnly = String(dateStr).split("T")[0];
    const [y, m, d] = dateOnly.split("-");
    if (!y || !m || !d) return dateStr;
    return `${d}-${m}-${y}`;
}

export default function RealisasiJobPage() {
    const navigate = useNavigate();
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
    const [deviceNow, setDeviceNow] = useState(() => new Date());
    const [openForm, setOpenForm] = useState(false);
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
        <div style={styles.page}>
            {/* HEADER */}
            <div style={styles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        style={styles.btnBack}
                        onClick={() => navigate("/menu")}
                    >
                        ← Back
                    </button>
                    <div>
                        <div style={styles.title}>REALISASI JOB PRODUKSI</div>
                        <div style={styles.sub}>{userLabel}</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        style={{
                            ...styles.btnPrimary,
                            opacity: 1,
                            cursor: "pointer",
                        }}
                        onClick={openAddForm}
                        disabled={false}
                        title="Tambah realisasi"
                    >
                        + Tambah Realisasi
                    </button>
                    <button
                        style={styles.btnSecondary}
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
                </div>
            </div>

            {/* FILTERS PANEL */}
            <div style={styles.filters}>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Tanggal</label>
                    <input
                        type="date"
                        style={styles.input}
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                    />
                </div>

                {isAdmin && (
                    <>
                        <div style={styles.filterGroup}>
                            <label style={styles.label}>Lini Produksi</label>
                            <select
                                style={styles.select}
                                value={lini}
                                onChange={(e) => setLini(e.target.value)}
                            >
                                <option value="JAHIT">JAHIT</option>
                                <option value="CUTTING">CUTTING</option>
                                <option value="FINISHING">FINISHING</option>
                            </select>
                        </div>
                        <div style={styles.filterGroup}>
                            <label style={styles.label}>Kelompok</label>
                            <select
                                style={styles.select}
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
                    <div style={styles.filterGroup}>
                        <label style={styles.label}>Info Kelompok</label>
                        <input
                            style={{
                                ...styles.input,
                                backgroundColor: "#F3F4F6",
                            }}
                            value={user.user_kelompok}
                            disabled
                        />
                    </div>
                )}
            </div>

            {/* DATA TABLE */}
            <div style={styles.tableWrap}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Jam</th>
                            <th style={styles.th}>Identitas Barang / SPK</th>
                            <th style={styles.thHighlight}>Target</th>
                            <th style={styles.thHighlight}>Realisasi</th>
                            <th style={styles.thCenter}>Kelompok</th>
                            <th style={styles.thCenter}>Lini</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td style={styles.tdEmpty} colSpan={6}>
                                    {loading
                                        ? "Sedang memuat..."
                                        : "Tidak ada data realisasi di kelompok ini"}
                                </td>
                            </tr>
                        ) : (
                            data.map((d, i) => (
                                <tr
                                    key={i}
                                    style={
                                        i % 2 === 0
                                            ? styles.trEven
                                            : styles.trOdd
                                    }
                                >
                                    <td style={styles.tdJam}>Jam {d.jam}</td>
                                    <td style={styles.td}>
                                        <div style={styles.spkName}>
                                            {d.spk_nama}
                                        </div>
                                        <div style={styles.spkDate}>
                                            {formatDateDDMMYYYY(d.tanggal)}
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL FORM */}
            {openForm && (
                <div
                    style={styles.modalOverlay}
                    onClick={() => setOpenForm(false)}
                >
                    <div
                        style={styles.modal}
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
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tanggal</label>
                                    <input
                                        type="date"
                                        style={styles.input}
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
                                        style={styles.select}
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
                                        style={styles.select}
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
                                        style={styles.select}
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
                                <div style={styles.formGroupFull}>
                                    <label style={styles.label}>
                                        Nomor SPK
                                    </label>
                                    <div style={styles.inputWithButton}>
                                        <input
                                            style={{
                                                ...styles.input,
                                                flex: 1,
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
                                        <button
                                            type="button"
                                            style={styles.btnCariSpk}
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
                                    <div
                                        style={{
                                            ...styles.spkResultText,
                                            color: form.nama
                                                ? "#059669"
                                                : "#D1D5DB",
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
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    table: { width: "100%", borderCollapse: "collapse" },
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
    tdEmpty: {
        padding: 48,
        textAlign: "center",
        color: "#9CA3AF",
        fontStyle: "italic",
    },

    trEven: { background: "#FFFFFF" },
    trOdd: { background: "#FBFBFA" },
    spkName: { fontWeight: 800, color: "#111827", fontSize: "14px" },
    spkDate: { fontSize: "11px", color: "#9CA3AF", marginTop: 2 },

    btnBack: {
        background: "none",
        border: "none",
        color: "#6B7280",
        fontWeight: 700,
        cursor: "pointer",
        fontSize: 14,
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
        background: "rgba(15, 23, 42, 0.6)", // Overlay lebih gelap agar fokus
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)", // Efek blur modern
    },
    modal: {
        width: "min(700px, 95vw)",
        maxHeight: "90vh",
        background: "#fff",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflowY: "auto",
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
        gridTemplateColumns: "1fr 1fr", // Dua kolom
        gap: "16px",
    },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    formGroupFull: {
        gridColumn: "span 2", // Melebar memenuhi dua kolom
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    inputWithButton: {
        display: "flex",
        gap: "4px", // Tombol dan input lebih rapat
        alignItems: "stretch",
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
};
