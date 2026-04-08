import Link from 'next/link'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
        Clerk + Next.js App Router
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
        Authentication is wired and ready
      </h1>
      <p className="mt-4 max-w-xl text-zinc-600">
        Use keyless mode immediately. Sign in or sign up, then open your protected dashboard.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Show when="signed-out">
          <SignInButton>
            <button className="rounded-full border border-zinc-300 px-5 py-2.5 font-medium text-zinc-900">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="rounded-full bg-[#6c47ff] px-5 py-2.5 font-medium text-white">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <UserButton />
            <Link
              href="/dashboard"
              className="rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white"
            >
              Go to dashboard
            </Link>
          </div>
        </Show>
      </div>
    </main>
  )
}
