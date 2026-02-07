import api from "../config/api";

export function getManPower(params) {
    // params: { cab, lini, tanggal, kelompok? }
    return api.get("/manpower", { params }).then((r) => r.data);
}

export function saveManPower(payload) {
    // payload: { cab, lini, tanggal, kelompok, mp, user }
    return api.post("/manpower", payload).then((r) => r.data);
}

export function deleteManPower(params) {
    // params: { cab, lini, tanggal, kelompok }
    return api.delete("/manpower", { params }).then((r) => r.data);
}
