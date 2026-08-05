export function SkyBackground() {
  return (
    <div aria-hidden className="sky-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0e]" />
      <div className="sky-ramp absolute inset-0 opacity-90" />
      <div className="sky-rays absolute -bottom-[14%] left-1/2 h-[118vh] w-[200vw] -translate-x-1/2 opacity-60" />
      <div className="sky-noise absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0e]/80" />
    </div>
  );
}
