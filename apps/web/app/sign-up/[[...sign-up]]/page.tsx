import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="logo" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface">Global Culinary Compass</h1>
          <p className="text-on-surface-variant text-sm mt-1">Create your account</p>
        </div>
        <SignUp
          appearance={{
            variables: { colorPrimary: '#a03f28' },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border border-outline/10 rounded-2xl',
            },
          }}
        />
      </div>
    </main>
  );
}
