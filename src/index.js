import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function MissingClerkKeyScreen() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#03070f] px-6 text-white">
            <section className="w-full max-w-xl rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
                <h1 className="text-xl font-semibold">Clerk key is missing</h1>
                <p className="mt-3 text-sm text-zinc-300">
                    Add <code>REACT_APP_CLERK_PUBLISHABLE_KEY</code> to your <code>.env</code> file
                    and restart the dev server.
                </p>
            </section>
        </main>
    );
}

function ClerkProviderWithRouter({ children }) {
    const navigate = useNavigate();

    if (!publishableKey) {
        return <MissingClerkKeyScreen />;
    }

    return (
        <ClerkProvider
            publishableKey={publishableKey}
            routerPush={(to) => navigate(to)}
            routerReplace={(to) => navigate(to, { replace: true })}
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
            afterSignOutUrl="/"
        >
            {children}
        </ClerkProvider>
    );
}

root.render(
    <>
        <BrowserRouter>
            <ClerkProviderWithRouter>
                <App />
            </ClerkProviderWithRouter>
        </BrowserRouter>
    </>
);
