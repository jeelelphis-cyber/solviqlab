// ─────────────────────────────────────────────────────────────────────────────
// registerProduct() — the one API developers call to add a product.
//
// Usage:
//   registerProduct({
//     slug:        'bmi-calculator',
//     name:        'BMI Calculator',
//     cluster:     'weight',
//     category:    'calculator',
//     graphMapper: new WeightGraphMapper(),
//     journey:     WeightJourney,
//   })
//
// After this call, the product is:
//   - Stored in ProductRegistry
//   - Auto-wired to UserGraph on every result
//   - Connected to Mia (or specified coach)
//   - Part of the Journey for its cluster
// ─────────────────────────────────────────────────────────────────────────────

import type { ProductManifest } from './types'
import { productRegistry }      from './registry'

export function registerProduct(manifest: ProductManifest): void {
  productRegistry.register(manifest)
}
