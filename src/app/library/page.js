import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LibraryPage() {
  return (
    <>
      <Header />
      <div className="max-w-[900px] mx-auto px-4 py-10 text-black">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>
        <p className="text-gray-600">Your saved/generator items will appear here.</p>
      </div>
      <Footer />
    </>
  );
}
