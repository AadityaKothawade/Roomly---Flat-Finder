import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment">
      <SignUp
        appearance={{
          variables: { colorPrimary: "#12213A" },
        }}
        fallbackRedirectUrl="/onboarding"
      />
    </main>
  );
}
