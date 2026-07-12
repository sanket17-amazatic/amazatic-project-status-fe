# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React SPA frontend for Amazatic Project Status — an internal project-health dashboard. Talks to the Django/DRF backend in the sibling repo `amazatic-project-status-backend` over CORS using session-cookie + CSRF auth (Google Workspace SSO via django-allauth headless, no JWT). See the planning repo's root `CLAUDE.md` (`amazatic-project-status`) for full product/stack context; this file covers only this repo.

## Commands

```bash
npm run dev       # Vite dev server (localhost:5173, matches backend CORS/CSRF allowlist)
npm run build     # tsc -b (typecheck, project references) && vite build
npm run lint       # oxlint
npm run preview    # serve the production build locally
```

There is no test runner configured in this repo yet (no `test` script, no test files). Typecheck (`tsc -b`, part of `build`) and `oxlint` are the only automated checks — run both before considering a change done.

Requires a `.env` with `VITE_API_BASE_URL` pointing at the backend (see `.env.example`; defaults to `http://localhost:8000` for local dev against the Django dev server).

## Architecture

### Routing and auth gating

`src/routes.tsx` is the single owner of the route table — page components are swapped out by feature work, but the route tree itself lives only there. `/login` is the only route outside the guard. Every other route is nested under `<AuthGuard><AppShell /></AuthGuard>` (`src/auth/AuthGuard.tsx`, `src/components/layout/AppShell.tsx`), which renders a skeleton while the session resolves, redirects to `/login` if unauthenticated, and otherwise renders the sidebar/top-bar shell with `<Outlet />`.

`AuthGuard` is a UX convenience only, not a security boundary — the backend independently enforces authorization on every endpoint (role-scoped querysets, 403 on out-of-scope object access). Don't rely on frontend route gating to hide data; the API call itself must be safe to make from an unauthenticated or wrong-role client.

### Session and CSRF

`src/lib/api.ts` (`apiFetch`/`getJson`/`postJson`/`patchJson`/`del`) is the only place that talks to the backend. It always sends `credentials: 'include'`, and for unsafe methods (POST/PUT/PATCH/DELETE) reads the `csrftoken` cookie and sends it as `X-CSRFToken` per Django's double-submit-cookie scheme. Non-2xx responses throw `ApiError` (with `.status` and parsed `.body`) — callers pattern-match on `error.status`, notably `useSession` treating 401/403 as "unauthenticated" rather than an error.

`src/auth/useSession.ts` hits the allauth headless session probe (`/_allauth/browser/v1/auth/session`, which also lands the `csrftoken` cookie) followed by `/api/me/`, then hydrates `src/stores/authStore.ts` (Zustand — `user.role` drives role-aware UI like the sidebar). Login itself (`src/pages/login/LoginPage.tsx`) is a native `<form method="post">` to the allauth provider-redirect endpoint, not a `fetch` call — a same-page fetch can't follow the cross-origin Google OAuth redirect, a real form submit can.

Because allauth is headless-only and session-cookie based, there is no client-held token anywhere (no JWT, no localStorage auth state) — the cookie + CSRF token are the entire auth story.

### Data layer

TanStack Query is the server-state layer; there is no separate fetch-in-`useEffect` pattern anywhere. Convention per resource, e.g. `src/hooks/useProjects.ts` / `useProject.ts` / `useProjectMutations.ts`:
- One `useQuery` hook per read, keyed `['resource', ...params]`.
- One `useMutation` hook per write, invalidating the relevant query keys `onSuccess` and firing a `sonner` toast.
- Query/mutation hooks own the fetch call and return a narrowed shape (`data`/`isLoading`/`isError`/`refetch`), not the raw TanStack Query result — page components consume the narrowed hook API.

Filtering/sorting (e.g. dashboard status filter, ordering) is passed as query params to the backend and included in the query key — it is never done client-side, even though the dataset is currently small. This mirrors a locked backend decision (server is the sole scoping/filtering authority); don't reintroduce client-side `.filter()`/`.sort()` on list data.

Zustand (`src/stores/`) is only for client-side/derived state that multiple components need without re-fetching (currently just the authenticated user/role). It is not a cache for server data — that's TanStack Query's job.

### Component structure

- `src/components/ui/` — shadcn/ui primitives (generated via the shadcn CLI, `components.json` config: `style: radix-nova`, base color slate, no rsc). Treat these as generated/vendored; prefer composing them over editing internals, and regenerate via `npx shadcn@latest add <component>` rather than hand-rolling new primitives.
- `src/components/` (top level) — small reusable domain components shared across pages (`StatusBadge`, `HealthBadge`, `ProgressCell`).
- `src/components/layout/` — app chrome (`AppShell`, `Sidebar`, `TopBar`).
- `src/pages/<feature>/` — route-level pages, grouped by feature (`dashboard/`, `login/`, `projects/`). Multi-tab pages nest a `tabs/` subfolder (`pages/projects/tabs/`).
- `src/hooks/` — one file per resource for TanStack Query hooks (see Data layer above).
- `src/auth/` — session/guard logic, separate from `stores/` (state) and `hooks/` (data fetching).
- `src/lib/` — cross-cutting utilities with no React dependency (`api.ts` fetch wrapper, `format.ts` display formatting, `utils.ts` — `cn()` for Tailwind class merging, `queryClient.ts`).

### Styling

Tailwind CSS v4 (config lives in `src/index.css`, not a `tailwind.config.js`) + shadcn/ui. Use the `cn()` helper (`src/lib/utils.ts`) when merging conditional classes with shadcn variants — it wraps `clsx` + `tailwind-merge` so later classes correctly override earlier ones. Status/health colors are semantic soft-badge tokens (tinted background + matching text color), kept distinct from the accent color used for interactive elements (buttons, links) — follow the existing pairs in `StatusBadge`/`HealthBadge` rather than inventing new color combinations for state.

### Path alias

`@/*` resolves to `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`) — use it for all intra-app imports instead of relative `../../` paths.

## Deployment (2026-07-11, quick-260711-0pu)

Production is `https://app.amazatic-project-status.in` — a private S3 bucket
behind CloudFront (Origin Access Control, not public/website-hosting mode),
same Route53 zone `api.amazatic-project-status.in` already lives on. `.github/workflows/deploy.yml`
runs on every push to `main`: `npm run build` (with `VITE_API_BASE_URL=https://api.amazatic-project-status.in`),
a two-pass `aws s3 sync`/`cp` (hashed assets get `immutable,max-age=31536000`;
`index.html` gets `no-cache` so it always revalidates to the latest build's
asset filenames), then a CloudFront invalidation. Auth is GitHub OIDC (no
long-lived AWS keys in this repo) via a role scoped to only this repo's
`sub` claim.

**The S3 bucket/CloudFront distribution/ACM cert/Route53 record/deploy role
are provisioned by `infra/envs/staging/` in THIS repo** — its own Terraform
stack and state (`backend.tf`: same shared S3 state bucket + DynamoDB lock
table the backend repo bootstrapped, but its own state *key*,
`staging/frontend.tfstate` — no shared lock contention, no risk of one
stack's apply touching the other's resources). The Route53 zone and the
GitHub OIDC provider are genuinely shared with the backend repo (same
domain, same GitHub org), so this stack looks both up via `data` sources
(`data.aws_route53_zone.this`, `data.aws_iam_openid_connect_provider.github`
in `iam.tf`) rather than re-declaring them — don't add a second
`aws_route53_zone`/`aws_iam_openid_connect_provider` resource here, it'll
either error as a duplicate or fork DNS/OIDC ownership across two states.
Bootstrapping a fresh environment:
1. `terraform apply` in `infra/envs/staging/` (this repo) — provisions the bucket/distribution/cert/DNS record/deploy role. No secrets needed (every variable has a default) — this is a much smaller `apply` than the backend's.
2. Set this repo's Actions secrets/variables from that apply's outputs: secret `AWS_DEPLOY_ROLE_ARN` = `frontend_deploy_role_arn`, variables `S3_BUCKET` = `frontend_bucket_name`, `CLOUDFRONT_DISTRIBUTION_ID` = `frontend_distribution_id`.
3. Push to `main` — first real deploy.

React Router client-side routes (e.g. `/projects/5`) have no matching S3
object; CloudFront rewrites S3's resulting 403/404 to a 200 `/index.html` so
the SPA's own router takes over — this is Terraform-side config, nothing to
maintain here.
