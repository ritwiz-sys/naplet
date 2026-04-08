import React from 'react';
import { SignIn, useAuth } from '@clerk/react';
import { Navigate } from 'react-router-dom';

function Login() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#03070f] px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.09),transparent_36%),radial-gradient(circle_at_82%_78%,rgba(255,255,255,0.07),transparent_34%)]" />

      <section className="relative w-full max-w-md rounded-2xl border border-white/20 p-3 backdrop-blur-2xl">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: 'bg-transparent shadow-none border-0',
              headerTitle: 'text-zinc-50',
              headerSubtitle: 'text-zinc-300',
              socialButtonsBlockButton:
                'border border-white/25 bg-white/5 text-zinc-100 hover:bg-white/10',
              formButtonPrimary:
                'bg-[#6c47ff] hover:bg-[#5c3ae0] text-white',
              footerActionLink: 'text-[#9eaef7] hover:text-[#c2cbff]',
            },
          }}
        />
      </section>
    </main>
  );
}

export default Login;
