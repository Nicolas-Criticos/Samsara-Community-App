export default function RealmSwitch({ isVrisch, onRealmChange }) {
  return (
    <div className="realm-switch">
      <span className={isVrisch ? undefined : "realm-label"}>SAMSARA</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={isVrisch}
          onChange={(e) => onRealmChange(e.target.checked)}
        />
        <span className="slider" />
      </label>
      <span className={isVrisch ? "active" : "realm-label"}>VRISCHGEWAGT</span>
    </div>
  );
}
