import { Button, TextInput } from "../../components/ui/index.js";
import { useLoginForm } from "./hooks/useLoginForm.js";

export default function LoginPage() {
  const f = useLoginForm();

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#f6f3ee]">
      <div className="w-80 rounded-[18px] bg-white/70 px-12 py-12 text-center backdrop-blur-sm">
        <h2>{f.mode === "login" ? "Login" : "Rite of Entry"}</h2>

        <TextInput
          type="email"
          className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
          placeholder="Email"
          value={f.email}
          onChange={(ev) => f.setEmail(ev.target.value)}
        />

        {f.mode === "login" ? (
          <div id="loginStage">
            <TextInput
              type="password"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Password"
              value={f.password}
              onChange={(ev) => f.setPassword(ev.target.value)}
            />
            <Button
              type="button"
              className="mt-3 w-full rounded-xl py-3"
              fullWidth
              onClick={f.login}
            >
              Login
            </Button>
            <p>
              <Button
                type="button"
                variant="link"
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
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Username"
              value={f.username}
              onChange={(ev) => f.setUsername(ev.target.value)}
            />
            <TextInput
              type="password"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Create password"
              value={f.passwordSignup}
              onChange={(ev) => f.setPasswordSignup(ev.target.value)}
            />
            <TextInput
              type="password"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Repeat password"
              value={f.passwordConfirm}
              onChange={(ev) => f.setPasswordConfirm(ev.target.value)}
            />
            <Button
              type="button"
              className="mt-3 w-full rounded-xl py-3"
              fullWidth
              onClick={f.signup}
            >
              Create account
            </Button>
            <p>
              <Button
                type="button"
                variant="link"
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

        {f.authError ? (
          <p className="mt-4 text-[0.9rem] text-amber-900" id="authError">
            {f.authError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
