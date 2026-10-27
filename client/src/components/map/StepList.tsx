import type { Maneuver, RouteStep } from '../../services/mapService';
import { formatDistance } from '../../services/mapService';
import { TurnLeftIcon, TurnRightIcon, StraightIcon, UTurnIcon, MergeIcon } from '../ui/icons';

export const MANEUVER_ICON: Record<Maneuver, typeof StraightIcon> = {
  left: TurnLeftIcon,
  right: TurnRightIcon,
  straight: StraightIcon,
  uturn: UTurnIcon,
  merge: MergeIcon,
};

/** Turn-by-turn directions as a list. Works with or without a map. */
export function StepList({ steps, current }: { steps: RouteStep[]; current?: number }) {
  return (
    <ol className="rows">
      {steps.map((step, i) => {
        const Icon = MANEUVER_ICON[step.maneuver];
        const active = i === current;
        return (
          <li key={i} className={`flex items-center gap-3.5 py-3 ${active ? 'font-semibold' : ''}`} aria-current={active ? 'step' : undefined}>
            <span className={`grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] ${active ? 'bg-ink text-bg' : 'bg-raised text-ink-soft'}`}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 leading-snug">{step.instruction.replace(/<[^>]*>/g, '')}</span>
            <span className="tnum shrink-0 text-sm text-ink-muted">{formatDistance(step.distance)}</span>
          </li>
        );
      })}
    </ol>
  );
}
