import { Button, TextInput } from "../../components/ui/index.js";
import { useLoginForm } from "./hooks/useLoginForm.js";

export default function LoginPage() {
  const f = useLoginForm();
  const {
    register: regLogin,
    formState: { errors: loginErrors },
  } = f.loginForm;
  const {
    register: regSignup,
    formState: { errors: signupErrors },
  } = f.signupForm;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#f6f3ee]">
      <div className="w-80 rounded-[18px] bg-white/70 px-12 py-12 text-center backdrop-blur-sm">
        <h2>{f.mode === "login" ? "Login" : "Rite of Entry"}</h2>

        {f.mode === "login" ? (
          <form id="loginStage" className="contents" onSubmit={f.loginSubmit}>
            <TextInput
              type="email"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Email"
              autoComplete="email"
              disabled={f.loginPending}
              {...regLogin("email", { required: "Email is required" })}
            />
            {loginErrors.email ? (
              <p className="text-left text-[0.8rem] text-amber-900">
                {loginErrors.email.message}
              </p>
            ) : null}
            <TextInput
              type="password"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Password"
              autoComplete="current-password"
              disabled={f.loginPending}
              {...regLogin("password", { required: "Password is required" })}
            />
            {loginErrors.password ? (
              <p className="text-left text-[0.8rem] text-amber-900">
                {loginErrors.password.message}
              </p>
            ) : null}
            <Button
              type="submit"
              className="mt-3 w-full rounded-xl py-3"
              fullWidth
              disabled={f.loginPending}
            >
              {f.loginPending ? "…" : "Login"}
            </Button>
            <p>
              <Button
                type="button"
                variant="link"
                onClick={f.switchToSignup}
              >
                No account? Sign up
              </Button>
            </p>
          </form>
        ) : (
          <form
            id="signupStage"
            className="contents"
            onSubmit={f.signupSubmit}
          >
            <TextInput
              type="email"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Email"
              autoComplete="email"
              disabled={f.signupPending}
              {...regSignup("email", { required: "Email is required" })}
            />
            {signupErrors.email ? (
              <p className="text-left text-[0.8rem] text-amber-900">
                {signupErrors.email.message}
              </p>
            ) : null}
            <TextInput
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Username"
              autoComplete="username"
              disabled={f.signupPending}
              {...regSignup("username", { required: "Username is required" })}
            />
            {signupErrors.username ? (
              <p className="text-left text-[0.8rem] text-amber-900">
                {signupErrors.username.message}
              </p>
            ) : null}
            <TextInput
              type="password"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Create password"
              autoComplete="new-password"
              disabled={f.signupPending}
              {...regSignup("passwordSignup", {
                required: "Password is required",
              })}
            />
            {signupErrors.passwordSignup ? (
              <p className="text-left text-[0.8rem] text-amber-900">
                {signupErrors.passwordSignup.message}
              </p>
            ) : null}
            <TextInput
              type="password"
              className="mb-2 mt-2 w-full rounded-[10px] border-0 px-3 py-3"
              placeholder="Repeat password"
              autoComplete="new-password"
              disabled={f.signupPending}
              {...regSignup("passwordConfirm", {
                required: "Confirm password",
              })}
            />
            {signupErrors.passwordConfirm ? (
              <p className="text-left text-[0.8rem] text-amber-900">
                {signupErrors.passwordConfirm.message}
              </p>
            ) : null}
            <Button
              type="submit"
              className="mt-3 w-full rounded-xl py-3"
              fullWidth
              disabled={f.signupPending}
            >
              {f.signupPending ? "…" : "Create account"}
            </Button>
            <p>
              <Button type="button" variant="link" onClick={f.switchToLogin}>
                Back to login
              </Button>
            </p>
          </form>
        )}

        {f.authNotice ? (
          <p className="mt-4 text-[0.9rem] text-amber-900" id="authError">
            {f.authNotice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
