import { Component, createRef } from "react";
import { fetchGroup, fetchMessages, sendMessage } from "../api/groups";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import io, { Socket } from "socket.io-client";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  text: string;
  sender: User;
  createdAt: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
}

interface AuthProps {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface GroupChatPageProps {
  auth: AuthProps;
  params: { groupId: string };
}

interface GroupChatPageState {
  group: Group | null;
  messages: Message[];
  newMessage: string;
  loading: boolean;
}

function withRouter(ComponentClass: any) {
  return function Wrapper(props: any) {
    const params = useParams();
    return <ComponentClass {...props} params={params} />;
  };
}

function withAuth(ComponentClass: any) {
  return function Wrapper(props: any) {
    const auth = useAuth();
    return <ComponentClass {...props} auth={auth} />;
  };
}

class GroupChatPage extends Component<GroupChatPageProps, GroupChatPageState> {
  private socket: typeof Socket | null = null;
  private messagesEndRef = createRef<HTMLDivElement>();

  constructor(props: GroupChatPageProps) {
    super(props);
    this.state = {
      group: null,
      messages: [],
      newMessage: "",
      loading: true,
    };
  }

  async componentDidMount() {
    await this.loadGroupAndMessages();
    this.initSocket();
  }

  componentWillUnmount() {
    this.disconnectSocket();
  }

  // Fetch group info and messages
  loadGroupAndMessages = async () => {
    const { groupId } = this.props.params;
    const { token } = this.props.auth;

    if (!groupId || !token) {
      toast.error("Missing group or authentication.");
      this.setState({ loading: false });
      return;
    }

    try {
      const group = await fetchGroup(token, Number(groupId));
      const messages = await fetchMessages(token, Number(groupId));
      this.setState({ group, messages });
      this.scrollToBottom();
    } catch (err) {
      console.error(err);
      toast.error("Failed to load group or messages");
    } finally {
      this.setState({ loading: false });
    }
  };

  // Initialize Socket.IO connection
  initSocket = () => {
    const { groupId } = this.props.params;
    const { token } = this.props.auth;
    if (!groupId || !token) return;

    this.disconnectSocket();

    this.socket = io(import.meta.env.VITE_API_BASE_URL, { 
      auth: { token },
      transports: ["websocket"] // Force WebSocket protocol
    });

    this.socket.on("connect", () => {
      console.log(`Connected: ${this.socket?.id}`);
      // Join the group room after connection
      this.socket?.emit("joinGroup", Number(groupId), () => {
        console.log(`Joined group-${groupId} room`);
      });
    });

    this.socket.on("newMessage", this.handleNewMessage);

    this.socket.on("connect_error", (err: Error) => {
      console.error("Socket.IO error:", err.message);
      toast.error("WebSocket connection failed");
    });
  };

  disconnectSocket = () => {
    if (this.socket) {
      this.socket.off("newMessage");
      this.socket.disconnect();
      this.socket = null;
    }
  };

  handleNewMessage = (msg: Message) => {
    this.setState(
      (prev) => ({ messages: [...prev.messages, msg] }),
      this.scrollToBottom
    );
  };

  scrollToBottom = () => {
    this.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  handleSendMessage = async () => {
  const { newMessage, messages } = this.state;
  const { user, token } = this.props.auth;
  const { groupId } = this.props.params;

  if (!newMessage || !newMessage.trim()) {
    toast.error("Cannot send an empty message");
    return;
  }

  if (!user || !token) {
    toast.error("You must be logged in to send messages");
    return;
  }

  try {
    const message = await sendMessage(token, Number(groupId), newMessage.trim());
    this.setState({ 
      messages: [...messages, message], 
      newMessage: "" 
    });
    this.scrollToBottom();
  } catch (err: any) {
    console.error(err);
    toast.error(err.response?.data?.error || "Failed to send message");
  }
};


  handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSendMessage();
    }
  };

  render() {
    const { group, messages, newMessage, loading } = this.state;
    const { user } = this.props.auth;

    if (loading) return <div className="p-6">Loading...</div>;
    if (!group) return <div className="p-6">Group not found</div>;
    if (!user) return <div className="p-6">User not authenticated</div>;

    return (
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {group.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{group.description}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender.id === user.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                  msg.sender.id === user.id
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"
                }`}
              >
                <div className="font-semibold text-sm">{msg.sender.name}</div>
                <div className="mt-1">{msg.text}</div>
                <div className="text-right text-xs mt-1 opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={this.messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full py-2 px-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newMessage}
              placeholder="Type a message..."
              onChange={(e) => this.setState({ newMessage: e.target.value })}
              onKeyDown={this.handleKeyDown}
            />
            <button
              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={this.handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withAuth(withRouter(GroupChatPage));
