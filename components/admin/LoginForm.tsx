"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";
import { Icon } from "@/components/Icons";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div>
        <label htmlFor="username" className="label">
          Username
        </label>
        <div className="relative">
          <Icon name="user" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            defaultValue={state.username}
            aria-invalid={Boolean(state.error)}
            className="input !pl-12"
            placeholder="admin"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <Icon name="lock" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? "login-error" : undefined}
            className="input !pl-12 !pr-14"
            placeholder="Your password"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-surface-sunken hover:text-ink-900"
          >
            <Icon name={show ? "eyeOff" : "eye"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-[#FDA4AF] bg-tone-danger-bg p-3.5 text-sm font-semibold text-tone-danger-fg"
          data-testid="login-error"
        >
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full !min-h-[52px] text-base" data-testid="login-submit">
        {pending ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
