import { Component } from "react";
import type { ChangeEvent } from "react";
import { GroupCard } from "../components/GroupCard";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { fetchGroups, fetchExploreGroups, createGroup, joinGroup } from "../api/groups";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

const GROUPS_PER_PAGE = 6;

function withNavigateAndAuth(ComponentClass: any) {
  return function Wrapper(props: any) {
    const navigate = useNavigate();
    const { token, isLoading: isAuthLoading } = useAuth();
    return <ComponentClass {...props} navigate={navigate} token={token} isAuthLoading={isAuthLoading} />;
  };
}

class GroupListPage extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      groups: [],
      exploreGroups: [],
      filteredGroups: [],
      filteredExploreGroups: [],
      groupPage: 1,
      explorePage: 1,
      groupSearch: "",
      exploreSearch: "",
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.loadGroups();
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.isAuthLoading !== this.props.isAuthLoading || prevProps.token !== this.props.token) {
      this.loadGroups();
    }
  }

  loadGroups = async () => {
    if (this.props.isAuthLoading) return;
    if (!this.props.token) {
      this.setState({ 
        loading: false,
        error: "You must be logged in to view groups"
      });
      return;
    }

    try {
      this.setState({ loading: true, error: null });
      const [myGroups, otherGroups] = await Promise.all([
        fetchGroups(this.props.token),
        fetchExploreGroups(this.props.token),
      ]);

      this.setState({
        groups: Array.isArray(myGroups) ? myGroups : [],
        exploreGroups: Array.isArray(otherGroups) ? otherGroups : [],
        filteredGroups: Array.isArray(myGroups) ? myGroups : [],
        filteredExploreGroups: Array.isArray(otherGroups) ? otherGroups : [],
        loading: false,
      });
    } catch (err) {
      console.error(err);
      this.setState({
        loading: false,
        error: "Failed to load groups",
        groups: [],
        exploreGroups: [],
        filteredGroups: [],
        filteredExploreGroups: [],
      });
      toast.error("Failed to load groups");
    }
  };

  handleCreateGroup = async () => {
    const name = prompt("Enter group name:");
    if (!name) return;

    try {
      const newGroup = await createGroup(this.props.token, name);
      this.setState((prev: any) => ({
        groups: [newGroup, ...prev.groups],
        filteredGroups: [newGroup, ...prev.filteredGroups],
      }));
      toast.success("Group created!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create group");
    }
  };

  handleGroupClick = (groupId: number) => {
    this.props.navigate(`/groups/${groupId}`);
  };

  handleJoinGroup = async (groupId: number) => {
    try {
      const joinedGroup = await joinGroup(this.props.token, groupId);
      this.setState((prev: any) => ({
        groups: [joinedGroup, ...prev.groups],
        filteredGroups: [joinedGroup, ...prev.filteredGroups],
        exploreGroups: prev.exploreGroups.filter((g: any) => g.id !== groupId),
        filteredExploreGroups: prev.filteredExploreGroups.filter((g: any) => g.id !== groupId),
      }));
      toast.success(`Joined group "${joinedGroup.name}"!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to join group");
    }
  };

  handleSearch = (e: ChangeEvent<HTMLInputElement>, type: "my" | "explore") => {
    const value = e.target.value.toLowerCase();
    if (type === "my") {
      this.setState((prev: any) => ({
        groupSearch: value,
        groupPage: 1,
        filteredGroups: prev.groups.filter((g: any) => g.name.toLowerCase().includes(value)),
      }));
    } else {
      this.setState((prev: any) => ({
        exploreSearch: value,
        explorePage: 1,
        filteredExploreGroups: prev.exploreGroups.filter((g: any) => g.name.toLowerCase().includes(value)),
      }));
    }
  };

  render() {
    const {
      filteredGroups,
      filteredExploreGroups,
      groupPage,
      explorePage,
      groupSearch,
      exploreSearch,
      loading,
      error,
    } = this.state;

    if (this.props.isAuthLoading) return <Loading />;
    if (error) return <p className="p-6 text-red-500">{error}</p>;
    if (loading) return <Loading />;
    const paginatedGroups = filteredGroups.slice(
      (groupPage - 1) * GROUPS_PER_PAGE,
      groupPage * GROUPS_PER_PAGE
    );
    const paginatedExplore = filteredExploreGroups.slice(
      (explorePage - 1) * GROUPS_PER_PAGE,
      explorePage * GROUPS_PER_PAGE
    );

    return (
      <div className="p-6">
        {/* My Groups Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Groups</h2>
          <button
            onClick={this.handleCreateGroup}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!this.props.token}
          >
            Create Group
          </button>
        </div>

        <input
          type="text"
          placeholder="Search your groups..."
          value={groupSearch}
          onChange={(e) => this.handleSearch(e, "my")}
          className="mb-4 px-3 py-1 border rounded w-full max-w-md focus:outline-none focus:ring focus:ring-blue-500"
        />

        {paginatedGroups.length === 0 ? (
          <p>No groups found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {paginatedGroups.map((group: any) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => this.handleGroupClick(group.id)}
              />
            ))}
          </div>
        )}

        {filteredGroups.length > GROUPS_PER_PAGE && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              disabled={groupPage === 1}
              onClick={() => this.setState({ groupPage: groupPage - 1 })}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={groupPage * GROUPS_PER_PAGE >= filteredGroups.length}
              onClick={() => this.setState({ groupPage: groupPage + 1 })}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Explore Groups Section */}
        <h2 className="text-xl font-semibold mb-4">Explore Groups</h2>

        <input
          type="text"
          placeholder="Search explore groups..."
          value={exploreSearch}
          onChange={(e) => this.handleSearch(e, "explore")}
          className="mb-4 px-3 py-1 border rounded w-full max-w-md focus:outline-none focus:ring focus:ring-blue-500"
        />

        {paginatedExplore.length === 0 ? (
          <p>No groups to explore right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {paginatedExplore.map((group: any) => (
              <div key={group.id} className="relative">
                <GroupCard
                  group={group}
                  onClick={() => this.handleGroupClick(group.id)}
                  isExplore={true}
                  onJoin={() => this.handleJoinGroup(group.id)}
                />
              </div>
            ))}
          </div>
        )}

        {filteredExploreGroups.length > GROUPS_PER_PAGE && (
          <div className="flex justify-center gap-4 mt-4">
            <button
              disabled={explorePage === 1}
              onClick={() => this.setState({ explorePage: explorePage - 1 })}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={explorePage * GROUPS_PER_PAGE >= filteredExploreGroups.length}
              onClick={() => this.setState({ explorePage: explorePage + 1 })}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default withNavigateAndAuth(GroupListPage);