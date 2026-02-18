import { useState, useEffect } from "react";
import { supabase } from "./utils/supabaseClient";
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
    extraCost: 0,
    bonuses: [createBonus()],
  };
}

function getRanks(offers) {
  const costs = offers.map((offer) => {
    const loanAmount = (offer.housePrice * offer.loanPercentage) / 100;
    const activeBonus = offer.bonuses
      .filter((b) => b.active)
      .reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);
    const effectiveRate = Math.max(0, offer.baseRate - activeBonus);
    const monthly = calculateMonthlyPayment(
      loanAmount,
      effectiveRate,
      offer.years,
    );
    const extraCost = offer.extraCost || 0;
    const totalMonthly = monthly + extraCost;
    return { id: offer.id, total: calculateTotalCost(totalMonthly, offer.years) };
  });
  costs.sort((a, b) => a.total - b.total);
  const ranks = {};
  costs.forEach((c, i) => {
    ranks[c.id] = i + 1;
  });
  return ranks;
}

export default function App() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedJson, setLastSavedJson] = useState(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('mortgage_comparisons')
            .select('offers')
            .single();

          if (data && data.offers) {
            setOffers(data.offers);
            setLastSavedJson(JSON.stringify(data.offers));
            setIsLoading(false);
            return;
          }
        }

        const jsonSaved = localStorage.getItem("offers");
        if (jsonSaved) {
          const parsed = JSON.parse(jsonSaved);
          setOffers(parsed);
          setLastSavedJson(jsonSaved);
        } else {
          const defaults = [createOffer("Banco A"), createOffer("Banco B")];
          setOffers(defaults);
          setLastSavedJson(JSON.stringify(defaults));
        }
      } catch (err) {
        console.warn("Supabase load skipped or failed:", err.message);
        const jsonSaved = localStorage.getItem("offers");
        if (jsonSaved) {
          setOffers(JSON.parse(jsonSaved));
          setLastSavedJson(jsonSaved);
        } else {
          const defaults = [createOffer("Banco A"), createOffer("Banco B")];
          setOffers(defaults);
          setLastSavedJson(JSON.stringify(defaults));
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Track changes vs last saved state
  useEffect(() => {
    if (isLoading) return;
    const currentJson = JSON.stringify(offers);
    setHasUnsavedChanges(currentJson !== lastSavedJson);

    // Always backup to LocalStorage
    localStorage.setItem("offers", currentJson);
  }, [offers, isLoading, lastSavedJson]);

  const handleCloudSave = async () => {
    if (!supabase || isSaving) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('mortgage_comparisons')
        .upsert({
          id: 1,
          offers: offers,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        setLastSavedJson(JSON.stringify(offers));
        setHasUnsavedChanges(false);
      } else {
        alert("Error al guardar en la nube: " + error.message);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mortgage_comparisons',
          filter: 'id=eq.1'
        },
        (payload) => {
          if (payload.new && payload.new.offers) {
            const remoteOffers = payload.new.offers;
            const remoteJson = JSON.stringify(remoteOffers);

            // Only update if the remote version is different from our local state
            // and we don't have pending changes (or we want to force override?)
            // Usually, Realtime should only update if we are NOT in the middle of editing.
            // But here, if someone else saves, we want to see it.
            setOffers(prevOffers => {
              if (JSON.stringify(prevOffers) !== remoteJson) {
                setLastSavedJson(remoteJson);
                return remoteOffers;
              }
              return prevOffers;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tus datos...</p>
      </div>
    );
  }

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
        <div className="header-actions">
          {hasUnsavedChanges && (
            <div className="sync-status" title="Tienes cambios locales sin subir a la nube">
              <span className="unsaved-dot">●</span>
              Pendiente
            </div>
          )}
          <button
            className={`save-btn ${hasUnsavedChanges ? 'unsaved' : ''}`}
            onClick={handleCloudSave}
            disabled={!supabase || isSaving}
          >
            {isSaving ? '...' : (hasUnsavedChanges ? '💾 Guardar' : '✓ Guardado')}
          </button>
          <button className="add-offer-btn" onClick={addOffer}>
            <span className="btn-icon">+</span>
            Añadir Banco
          </button>
        </div>
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
