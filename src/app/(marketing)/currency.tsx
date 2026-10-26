"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { formatPrice, PRICES, type Currency, type PriceKey } from "@/lib/site";
import styles from "./marketing.module.css";

const STORAGE_KEY = "currency";

// The business is based in Northern Ireland, so sterling is the default.
const DEFAULT_CURRENCY: Currency = "GBP";

const CurrencyContext = createContext<{ currency: Currency; setCurrency: (c: Currency) => void }>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
});

// Visitors in the Republic of Ireland see euro by default, everyone else
// sterling. A choice made with the switch is remembered on this device.
function detectCurrency(): Currency {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "GBP" || saved === "EUR") return saved;
  } catch {}
  return Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Dublin" ? "EUR" : "GBP";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Server render uses the default; the visitor's currency is applied after hydration.
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    const detected = detectCurrency();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must run after hydration to avoid a mismatch
    if (detected !== DEFAULT_CURRENCY) setCurrencyState(detected);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  }, []);

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function Price({ of }: { of: PriceKey }) {
  const { currency } = useContext(CurrencyContext);
  return <>{formatPrice(PRICES[currency][of], currency)}</>;
}

export function CurrencySwitch() {
  const { currency, setCurrency } = useContext(CurrencyContext);
  return (
    <div className={styles.currency} role="group" aria-label="Show prices in">
      {(["GBP", "EUR"] as const).map((c) => (
        <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}>
          {c === "GBP" ? "£ GBP" : "€ EUR"}
        </button>
      ))}
    </div>
  );
}
