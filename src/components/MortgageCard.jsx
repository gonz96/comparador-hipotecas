import { useMemo, useState, useRef } from 'react';
import BonusItem from './BonusItem';
import AmortizationChart from './AmortizationChart';
import {
    calculateMonthlyPayment,
    calculateTotalCost,
    calculateTotalInterest,
    calculateAmortizationSchedule,
    formatCurrency,
    formatPercent,
} from '../utils/mortgageUtils';

let bonusIdCounter = 0;

export function createBonus() {
    return {
        id: ++bonusIdCounter,
        label: '',
        value: 0.1,
        active: true,
        details: '',
    };
}

/**
 * Format a number with dot thousand separators for display.
 */
function formatPriceDisplay(value) {
    if (!value && value !== 0) return '';
    return Number(value).toLocaleString('es-ES');
}

/**
 * Parse a formatted price string back to a number.
 */
function parsePriceInput(str) {
    const cleaned = str.replace(/\./g, '').replace(/,/g, '.');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
}

/**
 * Smart number input handler that prevents leading zeros.
 * Returns the cleaned string value and parsed number.
 */
function cleanNumberInput(rawValue, opts = {}) {
    const { allowDecimal = false, min = 0, max = Infinity } = opts;
    let str = rawValue;

    // Remove leading zeros (except for "0" itself or "0.")
    if (allowDecimal) {
        str = str.replace(/^0+(?=\d)/, '');
        if (str === '' || str === '.') str = '0';
    } else {
        str = str.replace(/^0+/, '') || '0';
    }

    const parsed = allowDecimal ? parseFloat(str) : parseInt(str, 10);
    if (isNaN(parsed)) return { str: '0', num: 0 };
    const clamped = Math.max(min, Math.min(max, parsed));

    return { str: clamped.toString(), num: clamped };
}

export default function MortgageCard({
    offer,
    onUpdate,
    onDelete,
    rank,
    totalOffers,
}) {
    const [priceInput, setPriceInput] = useState(formatPriceDisplay(offer.housePrice));
    const [isPriceEditing, setIsPriceEditing] = useState(false);

    const loanAmount = (offer.housePrice * offer.loanPercentage) / 100;

    const activeBonus = offer.bonuses
        .filter((b) => b.active)
        .reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);

    const effectiveRate = Math.max(0, offer.baseRate - activeBonus);

    const monthlyPayment = calculateMonthlyPayment(
        loanAmount,
        effectiveRate,
        offer.years
    );
    const totalCost = calculateTotalCost(monthlyPayment, offer.years);
    const totalInterest = calculateTotalInterest(
        loanAmount,
        monthlyPayment,
        offer.years
    );

    const schedule = useMemo(
        () => calculateAmortizationSchedule(loanAmount, effectiveRate, offer.years),
        [loanAmount, effectiveRate, offer.years]
    );

    const handleField = (field, value) => {
        onUpdate({ ...offer, [field]: value });
    };

    // Smart handlers for numeric fields that prevent leading zeros
    const handleNumericField = (field, rawValue, opts = {}) => {
        const { allowDecimal = false, min, max } = opts;
        const cleaned = cleanNumberInput(rawValue, { allowDecimal, min, max });
        onUpdate({ ...offer, [field]: cleaned.num });
    };

    const handlePriceChange = (e) => {
        const raw = e.target.value;
        setPriceInput(raw);
        const parsed = parsePriceInput(raw);
        onUpdate({ ...offer, housePrice: parsed });
    };

    const handlePriceFocus = () => {
        setIsPriceEditing(true);
        setPriceInput(offer.housePrice.toString());
    };

    const handlePriceBlur = () => {
        setIsPriceEditing(false);
        setPriceInput(formatPriceDisplay(offer.housePrice));
    };

    const handleBonusUpdate = (updatedBonus) => {
        onUpdate({
            ...offer,
            bonuses: offer.bonuses.map((b) =>
                b.id === updatedBonus.id ? updatedBonus : b
            ),
        });
    };

    const handleBonusDelete = (id) => {
        onUpdate({
            ...offer,
            bonuses: offer.bonuses.filter((b) => b.id !== id),
        });
    };

    const addBonus = () => {
        onUpdate({
            ...offer,
            bonuses: [...offer.bonuses, createBonus()],
        });
    };

    const getRankClass = () => {
        if (totalOffers < 2) return '';
        if (rank === 1) return 'rank-best';
        if (rank === totalOffers) return 'rank-worst';
        return '';
    };

    // Controlled number input state to prevent leading zeros
    const [loanPctStr, setLoanPctStr] = useState(String(offer.loanPercentage));
    const [rateStr, setRateStr] = useState(String(offer.baseRate));
    const [yearsStr, setYearsStr] = useState(String(offer.years));

    return (
        <div className={`mortgage-card ${getRankClass()}`}>
            {rank === 1 && totalOffers > 1 && (
                <div className="best-badge">🏆 Mejor Oferta</div>
            )}

            <button className="card-delete" onClick={onDelete} title="Eliminar este banco">
                ✕
            </button>

            <div className="card-header">
                <input
                    className="bank-name-input"
                    type="text"
                    value={offer.bankName}
                    onChange={(e) => handleField('bankName', e.target.value)}
                    placeholder="Nombre del Banco"
                />
            </div>

            <div className="card-body">
                <div className="input-grid">
                    <div className="input-group">
                        <label>Precio de la Vivienda</label>
                        <div className="input-with-unit">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={isPriceEditing ? priceInput : formatPriceDisplay(offer.housePrice)}
                                onChange={handlePriceChange}
                                onFocus={handlePriceFocus}
                                onBlur={handlePriceBlur}
                            />
                            <span className="unit">€</span>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>% Financiación</label>
                        <div className="input-with-unit">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={loanPctStr}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                        setLoanPctStr('');
                                        handleField('loanPercentage', 0);
                                        return;
                                    }
                                    const cleaned = raw.replace(/^0+(?=\d)/, '');
                                    const num = parseInt(cleaned, 10);
                                    if (!isNaN(num) && num >= 0 && num <= 100) {
                                        setLoanPctStr(cleaned);
                                        handleField('loanPercentage', num);
                                    }
                                }}
                                onBlur={() => setLoanPctStr(String(offer.loanPercentage))}
                            />
                            <span className="unit">%</span>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Tipo de Interés Base</label>
                        <div className="input-with-unit">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={rateStr}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '' || raw === '0' || raw === '0.') {
                                        setRateStr(raw);
                                        handleField('baseRate', 0);
                                        return;
                                    }
                                    // Allow valid decimal input
                                    if (/^\d*\.?\d{0,2}$/.test(raw)) {
                                        const cleaned = raw.replace(/^0+(?=\d)/, '');
                                        const num = parseFloat(cleaned);
                                        if (!isNaN(num) && num >= 0 && num <= 20) {
                                            setRateStr(cleaned);
                                            handleField('baseRate', num);
                                        }
                                    }
                                }}
                                onBlur={() => setRateStr(String(offer.baseRate))}
                            />
                            <span className="unit">%</span>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Años</label>
                        <div className="input-with-unit">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={yearsStr}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                        setYearsStr('');
                                        handleField('years', 1);
                                        return;
                                    }
                                    const cleaned = raw.replace(/^0+(?=\d)/, '');
                                    const num = parseInt(cleaned, 10);
                                    if (!isNaN(num) && num >= 1 && num <= 50) {
                                        setYearsStr(cleaned);
                                        handleField('years', num);
                                    }
                                }}
                                onBlur={() => setYearsStr(String(offer.years))}
                            />
                            <span className="unit">años</span>
                        </div>
                    </div>
                </div>

                {/* Valores calculados */}
                <div className="derived-values">
                    <div className="derived-item loan-amount">
                        <span className="derived-label">Importe del Préstamo</span>
                        <span className="derived-value">{formatCurrency(loanAmount)}</span>
                    </div>
                    <div className="derived-item">
                        <span className="derived-label">Tipo Efectivo</span>
                        <span className="derived-value rate-value">
                            {formatPercent(effectiveRate)}
                            {activeBonus > 0 && (
                                <span className="rate-reduction">
                                    (−{formatPercent(activeBonus)})
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="derived-item highlight">
                        <span className="derived-label">Cuota Mensual</span>
                        <span className="derived-value">
                            {formatCurrency(monthlyPayment)}
                        </span>
                    </div>
                    <div className="derived-item">
                        <span className="derived-label">Coste Total</span>
                        <span className="derived-value">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="derived-item">
                        <span className="derived-label">Total Intereses</span>
                        <span className="derived-value interest-value">
                            {formatCurrency(totalInterest)}
                        </span>
                    </div>
                </div>

                {/* Barra de tipo */}
                <div className="rate-gauge">
                    <div className="gauge-track">
                        <div
                            className="gauge-fill"
                            style={{ width: `${Math.min(100, (effectiveRate / 6) * 100)}%` }}
                        ></div>
                    </div>
                    <div className="gauge-labels">
                        <span>0%</span>
                        <span>Efectivo: {formatPercent(effectiveRate)}</span>
                        <span>6%</span>
                    </div>
                </div>

                {/* Bonificaciones */}
                <div className="bonuses-section">
                    <div className="bonuses-header">
                        <h3>Bonificaciones</h3>
                        <button className="add-bonus-btn" onClick={addBonus}>
                            + Añadir
                        </button>
                    </div>
                    <div className="bonuses-list">
                        {offer.bonuses.map((bonus) => (
                            <BonusItem
                                key={bonus.id}
                                bonus={bonus}
                                onUpdate={handleBonusUpdate}
                                onDelete={() => handleBonusDelete(bonus.id)}
                            />
                        ))}
                        {offer.bonuses.length === 0 && (
                            <p className="no-bonuses">
                                Sin bonificaciones. Añade una para reducir el tipo de interés.
                            </p>
                        )}
                    </div>
                </div>

                {/* Cuadro de Amortización */}
                {schedule.length > 0 && (
                    <div className="chart-section">
                        <h3>Cuadro de Amortización</h3>
                        <AmortizationChart schedule={schedule} />
                    </div>
                )}
            </div>
        </div>
    );
}
