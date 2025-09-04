import Header from "@/components/Header";
import SeeAllResultsClient from "@/components/seeAllClient"

export const metadata = {
  title: "Search results",
  description: "See all matching presentations",
};

export default function SeeAllResultsPage({ searchParams }) {
  const sp = searchParams || {};
  const q = typeof sp.q === "string" ? sp.q : "";

  return (
    <>
      <Header />
      <section className="py-12">
        <div className="max-w-[1366px] mx-auto px-6 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
            Results for: <span className="text-purple-700">{q || "—"}</span>
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Scroll to load more presentations related to your search.
          </p>

          {/* No search box on this page as requested */}
          <SeeAllResultsClient initialQuery={q} />
        </div>
      </section>
    </>
  );
}
