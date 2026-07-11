import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment">
      <SignIn
        appearance={{
          variables: { colorPrimary: "#12213A" },
        }}
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
