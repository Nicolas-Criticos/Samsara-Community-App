export default function ParticleField({ particles }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-1"
      id="particles"
    >
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "rgba(90, 90, 90, 0.35)",
            opacity: 0,
            animation: `floatOrganic ${p.speed} ease-in-out infinite, driftSideways calc(${p.speed} * 0.6) ease-in-out infinite, breatheParticle 6s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
