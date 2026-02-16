import {
    calculateMonthlyPayment,
    calculateTotalCost,
    formatCurrency,
    formatPercent,
} from '../utils/mortgageUtils';

export default function ComparisonSummary({ offers }) {
    if (offers.length < 2) return null;

    const summaries = offers.map((offer) => {
        const loanAmount = (offer.housePrice * offer.loanPercentage) / 100;
        const activeBonus = offer.bonuses
            .filter((b) => b.active)
            .reduce((sum, b) => sum + b.value, 0);
        const effectiveRate = Math.max(0, offer.baseRate - activeBonus);
        const monthly = calculateMonthlyPayment(loanAmount, effectiveRate, offer.years);
        const total = calculateTotalCost(monthly, offer.years);
        const totalInterest = total - loanAmount;

        return {
            id: offer.id,
            bankName: offer.bankName || 'Banco sin nombre',
            effectiveRate,
            monthlyPayment: monthly,
            totalCost: total,
            totalInterest,
            loanAmount,
            years: offer.years,
        };
    });

    const bestTotal = Math.min(...summaries.map((s) => s.totalCost));

    const handleCopy = () => {
        const lines = summaries.map(
            (s) =>
                `${s.bankName}: Tipo ${formatPercent(s.effectiveRate)} | Cuota ${formatCurrency(s.monthlyPayment)} | Total ${formatCurrency(s.totalCost)} | Intereses ${formatCurrency(s.totalInterest)}`
        );
        const text = `Comparación de Hipotecas\n${'─'.repeat(50)}\n${lines.join('\n')}`;
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="comparison-summary">
            <div className="summary-header">
                <h2>📊 Resumen Comparativo</h2>
                <button className="copy-btn" onClick={handleCopy} title="Copiar al portapapeles">
                    📋 Copiar
                </button>
            </div>
            <div className="summary-cards">
                {summaries.map((s) => {
                    const isBest = s.totalCost === bestTotal;
                    const savings = s.totalCost - bestTotal;

                    return (
                        <div
                            key={s.id}
                            className={`summary-card ${isBest ? 'best' : ''}`}
                        >
                            {isBest && <span className="summary-trophy">🏆</span>}
                            <h3>{s.bankName}</h3>
                            <div className="summary-stats">
                                <div className="summary-stat">
                                    <span className="stat-label">Tipo</span>
                                    <span className="stat-value">{formatPercent(s.effectiveRate)}</span>
                                </div>
                                <div className="summary-stat">
                                    <span className="stat-label">Cuota</span>
                                    <span className="stat-value">{formatCurrency(s.monthlyPayment)}</span>
                                </div>
                                <div className="summary-stat">
                                    <span className="stat-label">Coste Total</span>
                                    <span className="stat-value total">{formatCurrency(s.totalCost)}</span>
                                </div>
                                <div className="summary-stat">
                                    <span className="stat-label">Intereses</span>
                                    <span className="stat-value interest">{formatCurrency(s.totalInterest)}</span>
                                </div>
                            </div>
                            {!isBest && savings > 0 && (
                                <div className="savings-badge">
                                    +{formatCurrency(savings)} vs mejor
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
