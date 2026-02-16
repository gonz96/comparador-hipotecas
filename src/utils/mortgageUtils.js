/**
 * Calculate monthly mortgage payment using the standard amortization formula.
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPayment(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  const factor = Math.pow(1 + monthlyRate, numPayments);

  return principal * (monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate total amount paid over the life of the mortgage.
 */
export function calculateTotalCost(monthlyPayment, years) {
  return monthlyPayment * years * 12;
}

/**
 * Calculate total interest paid.
 */
export function calculateTotalInterest(principal, monthlyPayment, years) {
  return calculateTotalCost(monthlyPayment, years) - principal;
}

/**
 * Generate a year-by-year amortization schedule.
 * Each entry: { year, principalPaid, interestPaid, remainingBalance }
 */
export function calculateAmortizationSchedule(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return [];

  const monthlyRate = annualRate <= 0 ? 0 : annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  const schedule = [];
  let balance = principal;

  for (let year = 1; year <= years; year++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let month = 0; month < 12; month++) {
      if (balance <= 0) break;
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
      yearInterest += interestPayment;
      yearPrincipal += principalPayment;
      balance -= principalPayment;
    }

    schedule.push({
      year,
      principalPaid: yearPrincipal,
      interestPaid: yearInterest,
      remainingBalance: Math.max(0, balance),
    });
  }

  return schedule;
}

/**
 * Format a number as EUR currency.
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage.
 */
export function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}
