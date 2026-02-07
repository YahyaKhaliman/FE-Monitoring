import api from "../config/api";

export async function getLini() {
    const res = await api.get("/spk-lini");
    return res.data;
}

export async function getSpkTargets(cab, lini) {
    const res = await api.get("/spk-target", { params: { cab, lini } });
    return res.data;
}

export async function createSpkTarget(payload) {
    const res = await api.post("/spk-target", payload);
    return res.data;
}

export async function updateSpkTarget(nomor, payload) {
    const res = await api.put(`/spk-target/${encodeURIComponent(nomor)}`, payload);
    return res.data;
}

export async function deleteSpkTarget(nomor, cab, lini) {
    const res = await api.delete(`/spk-target/${encodeURIComponent(nomor)}`, {
        params: { cab, lini },
    });
    return res.data;
}
