export function IndexBracket({ n }: { n: number | string }) {
  return (
    <span className="font-mono text-fs-index text-accent-500">
      [{String(n).padStart(2, '0')}]
    </span>
  )
}
