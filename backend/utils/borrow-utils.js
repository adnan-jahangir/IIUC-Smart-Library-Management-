const MS_PER_DAY = 1000 * 60 * 60 * 24;

const DAY_ALLOWANCE = 15; // days per period
const RENEWAL_MAX = 2;
const DAILY_FINE_RATE = 5; // BDT per overdue day

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function calculateFine(dueDate, returnDate = new Date(), dailyRate = DAILY_FINE_RATE) {
  if (!dueDate) return 0;
  const end = new Date(returnDate);
  if (end <= dueDate) return 0;
  const diffMs = end - new Date(dueDate);
  const daysLate = Math.ceil(diffMs / MS_PER_DAY);
  return daysLate * dailyRate;
}

function getRemainingRenewals(renewalCount, maxRenewals = RENEWAL_MAX) {
  return Math.max(0, maxRenewals - (renewalCount || 0));
}

module.exports = {
  MS_PER_DAY,
  DAY_ALLOWANCE,
  RENEWAL_MAX,
  DAILY_FINE_RATE,
  addDays,
  calculateFine,
  getRemainingRenewals
};
