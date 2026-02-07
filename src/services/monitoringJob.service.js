import api from "../config/api";

export const getMonitoring = (params) =>
    api.get("/monitoring", { params }).then(r => r.data);

export const getMonitoringDetail = (params) =>
    api.get("/monitoring/detail", { params }).then(r => r.data);
