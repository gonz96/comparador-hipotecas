import { useState, useEffect } from "react";
import MortgageCard, { createBonus } from "./components/MortgageCard";
import ComparisonSummary from "./components/ComparisonSummary";
import {
  calculateMonthlyPayment,
  calculateTotalCost,
} from "./utils/mortgageUtils";

function createOffer(bankName = "") {
  return {
    id: Date.now() + Math.random(),
    bankName,
    housePrice: 250000,
    loanPercentage: 80,
    baseRate: 3.0,
    years: 30,
    bonuses: [createBonus()],
  };
}

function getRanks(offers) {
  const costs = offers.map((offer) => {
    const loanAmount = (offer.housePrice * offer.loanPercentage) / 100;
    const activeBonus = offer.bonuses
      .filter((b) => b.active)
      .reduce((sum, b) => sum + b.value, 0);
    const effectiveRate = Math.max(0, offer.baseRate - activeBonus);
    const monthly = calculateMonthlyPayment(
      loanAmount,
      effectiveRate,
      offer.years,
    );
    return { id: offer.id, total: calculateTotalCost(monthly, offer.years) };
  });
  costs.sort((a, b) => a.total - b.total);
  const ranks = {};
  costs.forEach((c, i) => {
    ranks[c.id] = i + 1;
  });
  return ranks;
}

export default function App() {
  const [offers, setOffers] = useState(() => {
    const jsonSaved = localStorage.getItem("offers");
    const initialValue = JSON.parse(jsonSaved);
    return initialValue || [createOffer("Banco A"), createOffer("Banco B")];
  });

  const addOffer = () => {
    setOffers([...offers, createOffer()]);
  };

  const updateOffer = (updatedOffer) => {
    setOffers(offers.map((o) => (o.id === updatedOffer.id ? updatedOffer : o)));
  };

  const deleteOffer = (id) => {
    setOffers(offers.filter((o) => o.id !== id));
  };

  const ranks = getRanks(offers);

  useEffect(() => {
    localStorage.setItem("offers", JSON.stringify(offers));
  }, [offers]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">🏠</div>
          <div>
            <h1>Comparador de Hipotecas</h1>
            <p className="header-subtitle">
              Compara ofertas de diferentes bancos y encuentra la mejor opción
            </p>
          </div>
        </div>
        <button className="add-offer-btn" onClick={addOffer}>
          <span className="btn-icon">+</span>
          Añadir Banco
        </button>
      </header>

      <main className="offers-container">
        {offers.map((offer) => (
          <MortgageCard
            key={offer.id}
            offer={offer}
            onUpdate={updateOffer}
            onDelete={() => deleteOffer(offer.id)}
            rank={ranks[offer.id]}
            totalOffers={offers.length}
          />
        ))}
        {offers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏦</div>
            <h2>No hay ofertas todavía</h2>
            <p>Haz clic en "Añadir Banco" para empezar a comparar hipotecas</p>
          </div>
        )}
      </main>

      <ComparisonSummary offers={offers} />
    </div>
  );
}
