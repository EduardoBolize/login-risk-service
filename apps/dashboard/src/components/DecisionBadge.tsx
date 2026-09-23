import type { Decision } from '../api';
import { DECISION_STYLES } from '../format';

export function DecisionBadge({ decision }: { decision: Decision }) {
  const style = DECISION_STYLES[decision];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.badge}`}
    >
      {decision}
    </span>
  );
}
