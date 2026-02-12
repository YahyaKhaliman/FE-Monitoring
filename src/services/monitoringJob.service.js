import api from "../config/api";

export const getMonitoring = (params) =>
    api.get("/monitoring", { params }).then(r => r.data);

export const getMonitoringLini = (params) =>
    api.get("/monitoring/lini", { params }).then(r => r.data);

export const getMonitoringKelompok = (params) =>
    api.get("/monitoring/kelompok", { params }).then(r => r.data);

export const getMonitoringDetail = (params) =>
    api.get("/monitoring/detail", { params }).then(r => r.data);
