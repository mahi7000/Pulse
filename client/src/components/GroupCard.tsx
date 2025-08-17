import { Users, MessageCircle, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "./Avatar";

interface GroupCardProps {
  group: {
    id: number;
    name: string;
    description?: string | null;
    createdAt: Date | string;
    members?: { id: number }[];
    messages?: { createdAt: Date | string }[];
    color?: string;
  };
  onClick: () => void;
  isExplore?: boolean;
  onJoin?: () => void;
}

export function GroupCard({ group, onClick, isExplore = false, onJoin }: GroupCardProps) {
  const membersCount = group.members?.length || 0;
  const createdDate = new Date(group.createdAt).toLocaleDateString();

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Group avatar and basic info */}
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${group.color || 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
            <Users className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400">
              {group.name}
            </h3>
            
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-3.5 w-3.5" />
                <span>{membersCount} member{membersCount !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Created {createdDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right-side action */}
        {isExplore ? (
          <button
            onClick={(e) => { e.stopPropagation(); onJoin?.(); }}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Join
          </button>
        ) : (
          <MessageCircle className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400" />
        )}
      </div>

      {/* Group description */}
      {group.description && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2 dark:text-gray-300">
          {group.description}
        </p>
      )}

      {/* Footer section */}
      <div className="mt-4 flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          membersCount > 0 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {membersCount > 0 ? 'Active' : 'New'}
        </span>

        {/* Member avatars */}
        {membersCount > 0 && (
          <div className="flex -space-x-2">
            {group.members?.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="h-7 w-7 border-2 border-white dark:border-gray-800">
                <AvatarFallback className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                  {String.fromCharCode(65 + (member.id % 26))}
                </AvatarFallback>
              </Avatar>
            ))}

            {membersCount > 3 && (
              <div className="h-7 w-7 rounded-full bg-gray-200 border-2 border-white dark:bg-gray-600 dark:border-gray-800 flex items-center justify-center">
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  +{membersCount - 3}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
