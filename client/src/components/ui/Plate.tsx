/** A registration number set in a plate, so vehicles are easy to pick out of a list. */
export function Plate({ reg, className = '' }: { reg: string; className?: string }) {
  return (
    <span className={`plate ${className}`}>
      <span>{reg || 'Not set'}</span>
    </span>
  );
}
