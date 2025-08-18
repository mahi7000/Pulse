import { useEffect, useState } from "react";
import { fetchProfile } from "../api/user";
import type { UserProfile } from "../api/user";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

export const ProfilePage = () => {
  const { token, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    const loadProfile = async () => {
      if (!token) {
        setError("You must be logged in to view this page");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchProfile(token);
        setProfile(data);
      } catch (err: any) {
        console.error(err.response?.data || err.message);
        setError("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  if (isAuthLoading) return <Loading />;
  if (loading) return <Loading />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {profile && (
        <div className="bg-background rounded-xl border border-gray-700 p-6 shadow-md">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Name</h2>
            <p>{profile.name}</p>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold">Email</h2>
            <p>{profile.email}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Joined</h2>
            <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
