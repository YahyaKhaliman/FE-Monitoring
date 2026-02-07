import api from "../config/api";

export function getLaporan(params) {
    return api.get("/laporan", { params }).then((r) => r.data);
}