import api from "../config/api";

export function getRealisasi(params) {
    return api.get("/realisasi", { params }).then(r => r.data);
}

export function saveRealisasi(payload) {
    return api.post("/realisasi", payload).then(r => r.data);
}

export function deleteRealisasi(params) {
    return api.delete("/realisasi", { params }).then(r => r.data);
}
