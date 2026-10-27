/** Message under a field. Pair with aria-invalid and aria-describedby on the input. */
export function FieldError({ id, children }: { id: string; children?: string | false | null }) {
  if (!children) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {children}
    </p>
  );
}
