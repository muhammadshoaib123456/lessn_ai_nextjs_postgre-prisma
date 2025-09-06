import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <Header />
      <div className="max-w-[900px] mx-auto px-4 py-10 text-black">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        {session ? (
          <div className="bg-white rounded-xl border p-6">
            <div className="mb-4">
              <div className="text-gray-600 mb-1">Name</div>
              <div className="px-4 py-3 rounded-lg bg-gray-50 border">{session.user.name || "-"}</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Email</div>
              <div className="px-4 py-3 rounded-lg bg-gray-50 border">{session.user.email}</div>
            </div>
          </div>
        ) : (
          <p>Please <a className="underline" href="/login?next=/profile">log in</a>.</p>
        )}
      </div>
      <Footer />
    </>
  );
}
