export default function ParticleField({ particles }) {
  return (
    <div className="particles" id="particles">
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            "--speed": p.speed,
            "--size": p.size,
          }}
        />
      ))}
    </div>
  );
}
