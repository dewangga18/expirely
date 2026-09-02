# Shelf-life dataset — Dataset A

## Purpose

Dataset A provides a conservative planning estimate only for fresh items where the package has no printed expiry date. It helps prioritize use; it never determines that food is safe to consume.

## Current snapshot

- Runtime source: `expirely-backend/internal/modules/core/expirely_item/service/data/shelf_life.json`
- Scope: 10 fresh-food categories plus the `default_unknown` fallback.
- Contract: an estimated item response contains `estimate_basis` with the category, day estimate, source URL, and safety disclaimer.
- User-facing rule: the package label takes precedence. If a food's condition is uncertain, it must not be consumed based on an app estimate.

## Source and provenance

The snapshot links every category to the official [FoodSafety.gov Cold Food Storage Chart](https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts), reviewed by the source on 19 September 2023. The chart states refrigerator guidance assumes 4°C / 40°F or colder; freezer durations are generally quality guidance rather than a safety deadline.

The imported values are intentionally coarse category reminders because storage history, temperature, packaging, and food condition are not persisted for an item. They must be reviewed before expanding coverage or changing a category's estimate.

## Import status

An automated FoodKeeper spreadsheet download was attempted on 2 September 2026 but the USDA/FSIS host returned HTTP 403 to an identified request. The application therefore uses the checked-in, source-linked snapshot rather than a silent or unverifiable scraper result.

Before automated ingestion is enabled, it must have: a stable official distribution URL or explicit source permission, a parser with schema validation, reviewable change output, a source-date field, and a human approval step. Do not let a failed or changed upstream page overwrite this dataset at runtime.
