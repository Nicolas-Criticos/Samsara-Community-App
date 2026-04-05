import { Button, TextInput } from "../../components/ui/index.js";
import "../../styles/auth.css";
import { useLoginForm } from "./hooks/useLoginForm.js";

export default function LoginPage() {
  const f = useLoginForm();

  return (
    <div className="auth-gate" style={{ display: "flex" }}>
      <div className="auth-card">
        <h2>{f.mode === "login" ? "Login" : "Rite of Entry"}</h2>

        <TextInput
          type="email"
          placeholder="Email"
          value={f.email}
          onChange={(ev) => f.setEmail(ev.target.value)}
        />

        {f.mode === "login" ? (
          <div id="loginStage">
            <TextInput
              type="password"
              placeholder="Password"
              value={f.password}
              onChange={(ev) => f.setPassword(ev.target.value)}
            />
            <Button type="button" fullWidth onClick={f.login}>
              Login
            </Button>
            <p>
              <Button
                type="button"
                variant="link"
                className="link-like"
                onClick={() => {
                  f.setMode("signup");
                  f.setAuthError("");
                }}
              >
                No account? Sign up
              </Button>
            </p>
          </div>
        ) : (
          <div id="signupStage">
            <TextInput
              placeholder="Username"
              value={f.username}
              onChange={(ev) => f.setUsername(ev.target.value)}
            />
            <TextInput
              type="password"
              placeholder="Create password"
              value={f.passwordSignup}
              onChange={(ev) => f.setPasswordSignup(ev.target.value)}
            />
            <TextInput
              type="password"
              placeholder="Repeat password"
              value={f.passwordConfirm}
              onChange={(ev) => f.setPasswordConfirm(ev.target.value)}
            />
            <Button type="button" fullWidth onClick={f.signup}>
              Create account
            </Button>
            <p>
              <Button
                type="button"
                variant="link"
                className="link-like"
                onClick={() => {
                  f.setMode("login");
                  f.setAuthError("");
                }}
              >
                Back to login
              </Button>
            </p>
          </div>
        )}

        {f.authError ? <p id="authError">{f.authError}</p> : null}
      </div>
    </div>
  );
}
