// Module pur — ni Prisma ni React, voir docs/AGENTS.md et docs/PLAN.md §6.5.

/**
 * Arrondit un montant au centime le plus proche.
 * Chaque ligne d'un devis est calculée en pleine précision puis arrondie au
 * centime — c'est la convention qui rend le PDF vérifiable à la calculette.
 */
export function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
