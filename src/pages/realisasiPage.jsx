/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { getRealisasi } from "../services/realisasi.service";
import { loadUser } from "../utils/storage";

export default function RealisasiJobPage() {
    const user = loadUser();

    const isAdmin = user.user_bagian === "ADMIN";

    const [tanggal, setTanggal] = useState(
        new Date().toISOString().slice(0, 10)
    );

    const [lini, setLini] = useState(isAdmin ? "JAHIT" : user.user_bagian);
    const [kelompok, setKelompok] = useState(isAdmin ? "" : user.user_kelompok);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);

        const res = await getRealisasi({
        cab: user.user_cab,
        tanggal,
        lini: isAdmin ? lini : user.user_bagian,
        kelompok: isAdmin ? kelompok || undefined : user.user_kelompok,
        });

        if (res?.ok) setData(res.data);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, [tanggal, lini, kelompok]);

    return (
        <div style={{ padding: 16 }}>
        <h2>Realisasi Job</h2>

        {/* FILTER */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            />

            {/* LINI hanya untuk ADMIN */}
            {isAdmin && (
            <select value={lini} onChange={(e) => setLini(e.target.value)}>
                <option value="JAHIT">JAHIT</option>
                <option value="CUTTING">CUTTING</option>
                <option value="FINISHING">FINISHING</option>
            </select>
            )}

            {/* KELOMPOK hanya untuk ADMIN */}
            {isAdmin && (
            <input
                placeholder="Kelompok"
                value={kelompok}
                onChange={(e) => setKelompok(e.target.value)}
            />
            )}
        </div>

        {/* INFO USER */}
        <div style={{ fontSize: 12, marginBottom: 10 }}>
            Cabang: <b>{user.user_cab}</b> | Lini:{" "}
            <b>{isAdmin ? lini : user.user_bagian}</b>
            {!isAdmin && <> | Kelompok: <b>{user.user_kelompok}</b></>}
        </div>

        {/* DATA */}
        {loading && <div>Loading...</div>}

        {!loading && data.length === 0 && (
            <div>Tidak ada data</div>
        )}

        <ul style={{ paddingLeft: 16 }}>
            {data.map((d, i) => (
            <li key={i}>
                {d.tanggal} | {d.lini} | {d.kelompok} | Jam {d.jam} <br />
                <b>{d.spk_nama}</b> → {d.mr_realisasi}/{d.mr_target}
            </li>
            ))}
        </ul>
        </div>
    );
}
