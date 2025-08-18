import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { HabitCard } from "../components/HabitCard";
import { useAuth } from "../context/AuthContext";
import { habitsApi } from "../api/habits";
import type { Habit } from "../types/types";
import Loading from "../components/Loading";

const HABITS_PER_PAGE = 6;

export const HabitsPage = () => {
  const { token, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isAuthLoading) return;
    
    const loadHabits = async () => {
      try {
        if (!token) {
          setError("You must be logged in to view habits");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        const data = await habitsApi.fetchAll(token);
        setHabits(data);
        setFilteredHabits(data);
      } catch (err) {
        handleError(err, "Failed to load habits");
      } finally {
        setLoading(false);
      }
    };

    loadHabits();
  }, [token, isAuthLoading]);

  const handleError = (error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    setError(
      error instanceof Error ? error.message : defaultMessage
    );
  };

  const handleDelete = async (id: number) => {
    try {
      if (!token) {
        setError("Authentication required");
        return;
      }
      await habitsApi.delete(id, token);
      setHabits(prev => prev.filter(habit => habit.id !== id));
      setFilteredHabits(prev => prev.filter(habit => habit.id !== id));
    } catch (err) {
      handleError(err, "Failed to delete habit");
    }
  };

  const handleEdit = (habit: Habit) => {
    navigate(`/habits/edit/${habit.id}`, { state: { habit } });
  };

  const handleAddNew = () => {
    navigate("/habits/new");
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setPage(1);
    setFilteredHabits(habits.filter(h => h.name.toLowerCase().includes(value)));
  };

  const paginatedHabits = filteredHabits.slice(
    (page - 1) * HABITS_PER_PAGE, 
    page * HABITS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredHabits.length / HABITS_PER_PAGE);

  if (isAuthLoading) return <Loading />;
  if (error) return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
        <p>{error}</p>
        {!token && (
          <button
            onClick={() => navigate("/login")}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Your Habits</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow transition-colors whitespace-nowrap"
          disabled={!token}
        >
          + Add New Habit
        </button>
      </header>

      {loading ? (
        <Loading />
      ) : filteredHabits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-6 text-lg">
            {token ? "You don't have any habits yet" : "Please log in to view habits"}
          </p>
          {token && (
            <button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition-colors"
            >
              Create Your First Habit
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search habits..."
            value={search}
            onChange={handleSearch}
            className="mb-6 px-3 py-2 border rounded w-full max-w-md focus:outline-none focus:ring focus:ring-blue-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {paginatedHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onEdit={() => handleEdit(habit)}
                onDeleted={id => handleDelete(id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};