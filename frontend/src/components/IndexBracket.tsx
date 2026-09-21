export function IndexBracket({ n }: { n: number }) {
  return (
    <span className="tabular-nums text-ink-600 tabular-nums">
      [{String(n).padStart(2, '0')}]
    </span>
  );
}
