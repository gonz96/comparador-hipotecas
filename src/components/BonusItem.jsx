import { useState } from 'react';

export default function BonusItem({ bonus, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className={`bonus-item ${bonus.active ? 'active' : 'inactive'}`}>
            {/* Top: editable name + delete */}
            <div className="bonus-name-row">
                {isEditing ? (
                    <textarea
                        className="bonus-label-input"
                        value={bonus.label}
                        onChange={(e) => onUpdate({ ...bonus, label: e.target.value })}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                setIsEditing(false);
                            }
                        }}
                        autoFocus
                        placeholder="Ej: Nómina domiciliada"
                        rows={2}
                    />
                ) : (
                    <span
                        className="bonus-label"
                        onClick={() => setIsEditing(true)}
                        title="Clic para editar"
                    >
                        {bonus.label || 'Clic para nombrar...'}
                    </span>
                )}
                <button
                    className="bonus-delete"
                    onClick={onDelete}
                    title="Eliminar bonificación"
                >
                    ×
                </button>
            </div>

            {/* Middle: reduction value */}
            <div className="bonus-value-row">
                <div className="bonus-value-wrapper">
                    <span className="bonus-minus">−</span>
                    <input
                        className="bonus-value-input"
                        type="text"
                        inputMode="decimal"
                        value={bonus.value}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '0' || val === '0.') {
                                onUpdate({ ...bonus, value: val });
                                return;
                            }
                            const parsed = parseFloat(val);
                            if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
                                onUpdate({ ...bonus, value: val });
                            }
                        }}
                        onBlur={(e) => {
                            const parsed = parseFloat(e.target.value);
                            onUpdate({ ...bonus, value: isNaN(parsed) ? 0 : parsed });
                        }}
                    />
                    <span className="bonus-percent">%</span>
                </div>
            </div>

            {/* Toggle (centered, no label) */}
            <div className="bonus-toggle-row">
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={bonus.active}
                        onChange={(e) => onUpdate({ ...bonus, active: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Info button + collapsible details */}
            <div className="bonus-info-section">
                <button
                    className={`bonus-info-btn ${showDetails ? 'open' : ''}`}
                    onClick={() => setShowDetails(!showDetails)}
                    title="Ver condiciones"
                >
                    <span className="info-icon">ℹ</span>
                    <span className="info-text">{showDetails ? 'Ocultar' : 'Condiciones'}</span>
                </button>
                {showDetails && (
                    <textarea
                        className="bonus-details-input"
                        value={bonus.details || ''}
                        onChange={(e) => onUpdate({ ...bonus, details: e.target.value })}
                        placeholder="Escribe las condiciones concretas..."
                        rows={3}
                    />
                )}
            </div>
        </div>
    );
}
