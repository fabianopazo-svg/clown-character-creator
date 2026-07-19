import { updatePlayResource, updatePlayPathResource } from './roomsApi';
import { resolveResourceTarget } from './giftCostRouting';

// Deducts a Gift's cost from a character's live resources. Free/passive
// Gifts cost nothing, and this is a no-op for those. Variable-cost Gifts
// (no fixed amount, MC sets it) fall back to the cost's own `default`
// value as a reasonable v1 approximation — not editable at roll time yet.
export async function applyGiftCost(code, uid, character, cost) {
  if (!cost || !cost.parts || cost.parts.length === 0) return;

  for (const part of cost.parts) {
    const amount = part.amount ?? part.default ?? 0;
    if (!amount) continue;

    const target = resolveResourceTarget(part.resource);
    if (target.kind === 'universal') {
      const current = character.play?.[target.field] || 0;
      const newValue = Math.max(0, current - amount);
      await updatePlayResource(code, uid, target.field, newValue);
    } else {
      const current = character.play?.pathResource?.[target.field] || 0;
      const newValue = Math.max(0, current - amount);
      await updatePlayPathResource(code, uid, target.field, newValue);
    }
  }
}
