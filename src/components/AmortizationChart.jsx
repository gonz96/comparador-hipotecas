import { useRef, useEffect } from 'react';

export default function AmortizationChart({ schedule }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !schedule || schedule.length === 0) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 10, right: 10, bottom: 24, left: 10 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        const maxPayment = Math.max(
            ...schedule.map((s) => s.principalPaid + s.interestPaid)
        );
        if (maxPayment === 0) return;

        const barWidth = Math.max(2, chartW / schedule.length - 1);
        const gap = (chartW - barWidth * schedule.length) / (schedule.length + 1);

        schedule.forEach((entry, i) => {
            const x = padding.left + gap + i * (barWidth + gap);

            const principalH = (entry.principalPaid / maxPayment) * chartH;
            const interestH = (entry.interestPaid / maxPayment) * chartH;

            // Intereses (arriba, rojo/naranja)
            const interestGrad = ctx.createLinearGradient(x, padding.top + chartH - principalH - interestH, x, padding.top + chartH - principalH);
            interestGrad.addColorStop(0, '#ef4444');
            interestGrad.addColorStop(1, '#f97316');
            ctx.fillStyle = interestGrad;
            ctx.beginPath();
            ctx.roundRect(
                x,
                padding.top + chartH - principalH - interestH,
                barWidth,
                interestH,
                [2, 2, 0, 0]
            );
            ctx.fill();

            // Capital (abajo, verde/azul)
            const princGrad = ctx.createLinearGradient(x, padding.top + chartH - principalH, x, padding.top + chartH);
            princGrad.addColorStop(0, '#06b6d4');
            princGrad.addColorStop(1, '#0891b2');
            ctx.fillStyle = princGrad;
            ctx.beginPath();
            ctx.roundRect(
                x,
                padding.top + chartH - principalH,
                barWidth,
                principalH,
                [0, 0, 2, 2]
            );
            ctx.fill();

            // Etiquetas de año
            if (
                schedule.length <= 15 ||
                i === 0 ||
                i === schedule.length - 1 ||
                (i + 1) % 5 === 0
            ) {
                ctx.fillStyle = 'rgba(100, 116, 139, 0.7)';
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${entry.year}`, x + barWidth / 2, height - 4);
            }
        });
    }, [schedule]);

    return (
        <div className="amortization-chart">
            <div className="chart-legend">
                <span className="legend-principal">
                    <span className="legend-dot principal"></span> Capital
                </span>
                <span className="legend-interest">
                    <span className="legend-dot interest"></span> Intereses
                </span>
            </div>
            <canvas ref={canvasRef} className="chart-canvas" />
        </div>
    );
}
