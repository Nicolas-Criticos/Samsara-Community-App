import { Button, TextArea, TextInput } from "../../../components/ui/index.js";

export default function ProjectCreateModal({
  isVrisch,
  open,
  title,
  setTitle,
  description,
  setDescription,
  timeline,
  setTimeline,
  status,
  setStatus,
  cny,
  setCny,
  inspiration,
  setInspiration,
  imageFileRef,
  onSubmit,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="project-create" style={{ display: "flex" }}>
      <div className="project-create-inner">
        <h3>{isVrisch ? "Seed a Project" : "Seed an Offering"}</h3>

        <TextInput
          className="project-input"
          placeholder={isVrisch ? "Project name" : "Name of Offering"}
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextArea
          className="project-textarea"
          placeholder={isVrisch ? "Project description" : "Description"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextArea
          className="project-textarea"
          placeholder={isVrisch ? "Timeline / rhythm" : "Timespan / rhythm"}
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
        />

        <input
          ref={imageFileRef}
          type="file"
          className="project-file"
          accept="image/*"
        />

        <div className="project-status-select">
          <label>
            <input
              type="radio"
              name="projectStatus"
              checked={status === "open"}
              onChange={() => setStatus("open")}
            />
            🟢 Open contribution
          </label>
          <label>
            <input
              type="radio"
              name="projectStatus"
              checked={status === "application"}
              onChange={() => setStatus("application")}
            />
            🟠 By application
          </label>
          <label>
            <input
              type="radio"
              name="projectStatus"
              checked={status === "closed"}
              onChange={() => setStatus("closed")}
            />
            🔴 Closed
          </label>
        </div>

        {!isVrisch ? (
          <>
            <label className="project-flag">
              <input
                type="checkbox"
                checked={cny}
                onChange={(e) => setCny(e.target.checked)}
              />
              🧧 Chinese New Year
            </label>
            <div className="form-group inspiration">
              <label htmlFor="inspiration_link">Vision Board</label>
              <TextInput
                type="url"
                id="inspiration_link"
                name="inspiration_link"
                placeholder="Pinterest, Figma, Drive…"
                value={inspiration}
                onChange={(e) => setInspiration(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <div />
        <Button
          type="button"
          className="project-action-open"
          fullWidth
          onClick={onSubmit}
        >
          {isVrisch ? "SEED PROJECT" : "SEED OFFERING"}
        </Button>
        <Button type="button" className="ghost" fullWidth onClick={onCancel}>
          CANCEL
        </Button>
      </div>
    </div>
  );
}
