import { currentDbUser } from "@/lib/currentDbUser";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function TenantProfilePage() {
  const dbUser = await currentDbUser();

  if (!dbUser || dbUser.role !== "tenant") {
    return (
      <main className="min-h-screen bg-parchment">
        <Nav dbUser={dbUser} />
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <p className="text-ink/60">This page is for tenants only.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment">
      <Nav dbUser={dbUser} />
      <PageHeader title="My preferences" backHref="/listings" backLabel="Browse rooms" />
      <ProfileForm />
    </main>
  );
}
