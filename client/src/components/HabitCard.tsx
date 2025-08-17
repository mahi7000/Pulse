import { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ChevronUp, 
  ChevronDown 
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { habitsApi } from "../api/habits";
import type { Habit, HabitLog, Streak } from "../types/types";

interface HabitCardProps {
  habit: Habit;
  onEdit: () => void;
  onDeleted: (id: number) => void;
}

export const HabitCard = ({ habit, onEdit, onDeleted }: HabitCardProps) => {
  const { token } = useAuth();
  const [isBouncing, setIsBouncing] = useState(false);
  const [localHabit, setLocalHabit] = useState<Habit>(habit);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Derived state
  const currentStreak = localHabit.streaks?.[0]?.currentStreak ?? 0;
  const longestStreak = localHabit.streaks?.[0]?.longestStreak ?? 0;
  const todayLog = localHabit.logs?.find(log => isToday(new Date(log.date)));
  const isCompleted = todayLog?.completed ?? false;
  const currentCount = todayLog?.count ?? 0;

  const updateHabitState = (log: HabitLog, streak: Streak): void => {
    setLocalHabit(prev => ({
      ...prev,
      logs: prev.logs 
        ? [...prev.logs.filter(l => !isToday(new Date(l.date))), log] 
        : [log],
      streaks: [streak]
    }));
  };

  const handleToggle = async (): Promise<void> => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    setIsToggling(true);
    setIsBouncing(true);
    
    try {
      const { log, streak } = await habitsApi.toggleLog(
        localHabit.id, 
        !isCompleted,
        token,
        currentCount,
      );
      updateHabitState(log, streak);
      toast.success(isCompleted ? "Marked incomplete" : "Marked complete!");
    } catch (err) {
      console.error("Failed to toggle habit:", err);
      toast.error("Failed to update habit");
    } finally {
      setIsToggling(false);
      setTimeout(() => setIsBouncing(false), 600);
    }
  };

  const handleCountChange = async (action: 'increment' | 'decrement'): Promise<void> => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const { log, streak } = action === 'increment'
        ? await habitsApi.increment(localHabit.id, currentCount, token)
        : await habitsApi.decrement(localHabit.id, currentCount, token);
      
      updateHabitState(log, streak);
      toast.success(`Count ${action === 'increment' ? 'increased' : 'decreased'}`);
    } catch (err) {
      console.error(`Failed to ${action} habit:`, err);
      toast.error(`Failed to ${action} habit`);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    if (!confirm("Are you sure you want to delete this habit?")) return;
    
    setIsDeleting(true);
    try {
      await habitsApi.delete(localHabit.id, token);
      onDeleted(localHabit.id);
      toast.success("Habit deleted successfully");
    } catch (err) {
      console.error("Failed to delete habit:", err);
      toast.error("Failed to delete habit");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {localHabit.name}
            </h3>
            {localHabit.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {localHabit.description}
              </p>
            )}
          </div>

          <Menu as="div" className="relative">
            <Menu.Button 
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Habit options"
              disabled={isDeleting}
            >
              <MoreVertical className="h-5 w-5" />
            </Menu.Button>

            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 dark:divide-gray-700">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button 
                        onClick={onEdit}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                      >
                        <Edit3 className="mr-3 h-4 w-4" /> 
                        Edit Habit
                      </button>
                    )}
                  </Menu.Item>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={`${
                          active ? 'bg-red-50 dark:bg-red-900/30' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 disabled:opacity-50`}
                      >
                        <Trash2 className="mr-3 h-4 w-4" />
                        {isDeleting ? 'Deleting...' : 'Delete Habit'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Flame className={`h-5 w-5 ${
                currentStreak > 0 ? "text-orange-500" : "text-gray-400"
              }`} />
              <div className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentStreak} day{currentStreak !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  current
                </span>
              </div>
            </div>

            {longestStreak > 0 && (
              <div className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {longestStreak}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  longest
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {localHabit.targetCount && localHabit.targetCount > 1 ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleCountChange('decrement')}
                disabled={currentCount <= 0 || isToggling}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease count"
              >
                <ChevronDown className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>

              <div className="text-lg font-medium min-w-[60px] text-center text-gray-900 dark:text-white">
                {currentCount} / {localHabit.targetCount}
              </div>

              <button 
                onClick={() => handleCountChange('increment')}
                disabled={currentCount >= localHabit.targetCount || isToggling}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase count"
              >
                <ChevronUp className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          ) : (
            <div className="flex-1"></div>
          )}

          <button 
            onClick={handleToggle}
            disabled={isToggling}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isCompleted 
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50" 
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-green-500 dark:hover:text-green-400"
            } ${isBouncing ? "animate-[bounce_0.6s]" : ""}`}
            aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}