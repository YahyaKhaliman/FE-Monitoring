import React from "react";

// 1. Skeleton untuk Baris Tabel (Table Row)
export function SkeletonTableRow({ cols = 4 }) {
    return (
        <tr className="skeleton-tr">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
                    <div 
                        className="skeleton" 
                        style={{ 
                            height: "16px", 
                            width: i === 0 ? "50%" : i === 1 ? "80%" : i === 2 ? "40%" : "60%",
                            borderRadius: "4px" 
                        }} 
                    />
                </td>
            ))}
        </tr>
    );
}

// 2. Skeleton untuk Tabel Utuh (Table Placeholder)
export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonTableRow key={i} cols={cols} />
            ))}
        </>
    );
}

// 3. Skeleton untuk Card Ringkasan/Statistik (Stat Card Placeholder)
export function SkeletonCard() {
    return (
        <div 
            style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
            }}
        >
            <div className="skeleton" style={{ height: "14px", width: "40%" }} />
            <div className="skeleton" style={{ height: "28px", width: "70%" }} />
            <div className="skeleton" style={{ height: "12px", width: "90%" }} />
        </div>
    );
}

// 4. Skeleton untuk Grafik (Chart Placeholder)
export function SkeletonChart() {
    return (
        <div 
            style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #E5E7EB",
                height: "350px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
            }}
        >
            <div className="skeleton" style={{ height: "20px", width: "50%", margin: "0 auto 24px" }} />
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flex: 1, padding: "0 10px" }}>
                <div className="skeleton" style={{ height: "40%", flex: 1 }} />
                <div className="skeleton" style={{ height: "80%", flex: 1 }} />
                <div className="skeleton" style={{ height: "60%", flex: 1 }} />
                <div className="skeleton" style={{ height: "90%", flex: 1 }} />
                <div className="skeleton" style={{ height: "50%", flex: 1 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                <div className="skeleton" style={{ height: "10px", width: "12%" }} />
                <div className="skeleton" style={{ height: "10px", width: "12%" }} />
                <div className="skeleton" style={{ height: "10px", width: "12%" }} />
                <div className="skeleton" style={{ height: "10px", width: "12%" }} />
                <div className="skeleton" style={{ height: "10px", width: "12%" }} />
            </div>
        </div>
    );
}
