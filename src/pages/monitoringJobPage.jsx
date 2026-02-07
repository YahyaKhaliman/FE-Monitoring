/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { getMonitoring } from "../services/monitoringJob.service";
import { loadUser } from "../utils/storage";

export default function MonitoringJobPage() {
    const user = loadUser();

    const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0,10));
    const [lini, setLini] = useState("JAHIT");
    const [kelompok, setKelompok] = useState("");
    const [rows, setRows] = useState([]);
    const [avg, setAvg] = useState(0);

    async function load() {
        const res = await getMonitoring({
        cab: user.user_cab,
        tanggal,
        lini,
        kelompok,
        });
        if (res.ok) {
        setRows(res.data);
        setAvg(res.avg_persen);
        }
    }

    useEffect(() => {
        load();
        const t = setInterval(load, 20000); // auto refresh TV
        return () => clearInterval(t);
    }, [tanggal, lini, kelompok]);

    return (
        <div>
        <h1>Monitoring Job</h1>
        <h2 style={{ color: avg >= 75 ? "green" : "red" }}>
            Nilai: {avg}%
        </h2>

        <table>
            <thead>
            <tr>
                <th>Jam</th>
                <th>MP</th>
                <th>SPK</th>
                <th>Target</th>
                <th>Realisasi</th>
                <th>%</th>
            </tr>
            </thead>
            <tbody>
            {rows.map((r,i) => (
                <tr key={i}>
                <td>{r.jam.replace("-","")}</td>
                <td>{r.mp}</td>
                <td style={{ whiteSpace:"pre-line" }}>{r.spk}</td>
                <td>{r.target}</td>
                <td>{r.realisasi}</td>
                <td style={{ color: r.persen >= 100 ? "green" : "red" }}>
                    {r.persen}%
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
}
