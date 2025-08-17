import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Target, Users } from 'lucide-react';
import { HabitCard } from '../components/HabitCard';
import { GroupCard } from '../components/GroupCard';
import type { Habit, Group } from '../types/types';
import { useAuth } from '../context/AuthContext';
import { habitsApi } from '../api/habits';
import { fetchGroups } from '../api/groups';

const ITEMS_PER_PAGE = 4; // habits per page
const GROUPS_PER_PAGE = 3; // groups per page

export const Home = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [habitPage, setHabitPage] = useState(1);
  const [groupPage, setGroupPage] = useState(1);
  const [habitSearch, setHabitSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHabitsAndGroups = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const habitsData = await habitsApi.fetchAll(token);
        setHabits(habitsData);
        setFilteredHabits(habitsData);
        // For groups, assume token-based fetchGroups exists
        const groupsData = await fetchGroups(token); 
        setGroups(groupsData);
        setFilteredGroups(groupsData);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadHabitsAndGroups();

    if (loading) console.log("Loading...");
  }, [token]);

  // Search handlers
  const handleHabitSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setHabitSearch(value);
    setHabitPage(1);
    setFilteredHabits(habits.filter(h => h.name.toLowerCase().includes(value)));
  };

  const handleGroupSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setGroupSearch(value);
    setGroupPage(1);
    setFilteredGroups(groups.filter(g => g.name.toLowerCase().includes(value)));
  };

  // Pagination helpers
  const paginatedHabits = filteredHabits.slice(
    (habitPage - 1) * ITEMS_PER_PAGE,
    habitPage * ITEMS_PER_PAGE
  );

  const paginatedGroups = filteredGroups.slice(
    (groupPage - 1) * GROUPS_PER_PAGE,
    groupPage * GROUPS_PER_PAGE
  );

  const handleAddNewHabit = () => navigate('/habits/new');
  const handleGroupClick = (groupId: number) => navigate(`/groups/${groupId}`);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome to Pulse!</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your habits and progress</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Habits Section */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-semibold text-foreground">Your Habits</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">({filteredHabits.length})</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search habits..."
                  value={habitSearch}
                  onChange={handleHabitSearch}
                  className="px-3 py-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                />
                <button
                  onClick={handleAddNewHabit}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Habit
                </button>
              </div>
            </div>

            {paginatedHabits.length === 0 ? (
              <p>No habits found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {paginatedHabits.map(h => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    onEdit={() => navigate(`/habits/edit/${h.id}`, { state: { habit: h } })}
                    onDeleted={() => setHabits(prev => prev.filter(x => x.id !== h.id))}
                  />
                ))}
              </div>
            )}

            {/* Habits Pagination */}
            {filteredHabits.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center gap-4 mt-4">
                <button
                  disabled={habitPage === 1}
                  onClick={() => setHabitPage(p => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={habitPage * ITEMS_PER_PAGE >= filteredHabits.length}
                  onClick={() => setHabitPage(p => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </section>

          {/* Groups Section */}
          <section className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-semibold text-foreground">Your Groups</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">({filteredGroups.length})</span>
              </div>
              <input
                type="text"
                placeholder="Search groups..."
                value={groupSearch}
                onChange={handleGroupSearch}
                className="px-3 py-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-500"
              />
            </div>

            {paginatedGroups.length === 0 ? (
              <p>No groups found.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {paginatedGroups.map((g: any) => (
                  <GroupCard key={g.id} group={g} onClick={() => handleGroupClick(g.id)} />
                ))}
              </div>
            )}

            {/* Groups Pagination */}
            {filteredGroups.length > GROUPS_PER_PAGE && (
              <div className="flex justify-center gap-4 mt-4">
                <button
                  disabled={groupPage === 1}
                  onClick={() => setGroupPage(p => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={groupPage * GROUPS_PER_PAGE >= filteredGroups.length}
                  onClick={() => setGroupPage(p => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
