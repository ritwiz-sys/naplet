import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/')
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Protected Route</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
      <p className="mt-4 text-zinc-600">
        You are signed in and can access this page. User ID: <span className="font-mono">{userId}</span>
      </p>
    </main>
  )
}
