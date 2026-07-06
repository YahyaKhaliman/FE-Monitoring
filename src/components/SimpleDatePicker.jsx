import React from "react";
import { AiFillCaretLeft, AiFillCaretRight, AiOutlineCalendar } from "react-icons/ai";

export default function SimpleDatePicker({ value, onChange, minDate, maxDate }) {
    const addDays = (dateStr, days) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    };

    const canPrev = () => {
        if (!value) return true;
        if (!minDate) return true;
        return addDays(value, -1) >= minDate;
    };
    const canNext = () => {
        if (!value) return true;
        if (!maxDate) return true;
        return addDays(value, 1) <= maxDate;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
                type="button"
                onClick={() => value && canPrev() && onChange(addDays(value, -1))}
                style={{
                    height: 42,
                    width: 32,
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: canPrev() ? '#fff' : '#F3F4F6',
                    color: '#374151',
                    fontSize: 18,
                    cursor: value && canPrev() ? 'pointer' : 'not-allowed',
                    marginRight: 2
                }}
                disabled={!value || !canPrev()}
                tabIndex={-1}
                aria-label="Tanggal sebelumnya"
            >
                <AiFillCaretLeft />
            </button>
            
            {/* Container Input dengan Custom Calendar Icon */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    width: 150,
                    height: 42,
                    borderRadius: 8,
                    border: "1px solid #D1D5DB",
                    background: "#fff",
                    cursor: "pointer",
                    boxSizing: "border-box",
                }}
            >
                <style>{`
                    .custom-datepicker-input::-webkit-calendar-picker-indicator,
                    .custom-datepicker-input::-webkit-inner-spin-button,
                    .custom-datepicker-input::-webkit-clear-button {
                        display: none !important;
                        -webkit-appearance: none !important;
                        appearance: none !important;
                    }
                `}</style>
                <input
                    type="date"
                    value={value || ""}
                    onChange={e => onChange(e.target.value)}
                    onClick={(e) => {
                        try {
                            e.target.showPicker();
                        } catch (err) {
                            console.warn("showPicker not supported", err);
                        }
                    }}
                    min={minDate}
                    max={maxDate}
                    className="custom-datepicker-input"
                    style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        padding: "0 28px 0 12px",
                        fontSize: 13,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        textAlign: 'left',
                        WebkitAppearance: "none",
                        appearance: "none",
                        boxSizing: "border-box",
                    }}
                />
                <AiOutlineCalendar 
                    size={16}
                    style={{
                        position: "absolute",
                        right: 8,
                        color: "#6B7280",
                        pointerEvents: "none",
                    }}
                />
            </div>

            <button
                type="button"
                onClick={() => value && canNext() && onChange(addDays(value, 1))}
                style={{
                    height: 42,
                    width: 32,
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: canNext() ? '#fff' : '#f6f4f3',
                    color: '#374151',
                    fontSize: 18,
                    cursor: value && canNext() ? 'pointer' : 'not-allowed',
                    marginLeft: 2
                }}
                disabled={!value || !canNext()}
                tabIndex={-1}
                aria-label="Tanggal berikutnya"
            >
                <AiFillCaretRight />
            </button>
        </div>
    );
}
