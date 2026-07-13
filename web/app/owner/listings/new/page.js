import { currentDbUser } from "@/lib/currentDbUser";
import Nav from "@/components/Nav";
import PageHeader from "@/components/PageHeader";
import ListingForm from "./ListingForm";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const dbUser = await currentDbUser();

  if (!dbUser || dbUser.role !== "owner") {
    return (
      <main className="min-h-screen bg-parchment">
        <Nav dbUser={dbUser} />
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <p className="text-ink/60">This page is for owners only.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment">
      <Nav dbUser={dbUser} />
      <PageHeader title="New listing" backHref="/owner/dashboard" backLabel="My listings" />
      <ListingForm />
    </main>
  );
}
