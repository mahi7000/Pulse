import { Component, createRef } from "react";
import { fetchGroup, fetchMessages, sendMessage } from "../api/groups";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import io, { Socket } from "socket.io-client";
import Loading from "../components/Loading";
import { format, parseISO, isValid } from "date-fns";

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
  isSending?: boolean;
  tempId?: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
}

interface GroupChatPageProps {
  token: string | null;
  user: User | null;
  isAuthLoading: boolean;
  params: { groupId: string };
}

interface GroupChatPageState {
  group: Group | null;
  messages: Message[];
  newMessage: string;
  loading: boolean;
  error: string | null;
}

function withRouterAndAuth(ComponentClass: any) {
  return function Wrapper(props: any) {
    const params = useParams();
    const { token, user, isLoading: isAuthLoading } = useAuth();
    return <ComponentClass {...props} params={params} token={token} user={user} isAuthLoading={isAuthLoading} />;
  };
}

class GroupChatPage extends Component<GroupChatPageProps, GroupChatPageState> {
  private socket: typeof Socket | null = null;
  private messagesEndRef = createRef<HTMLDivElement>();
  private messagesContainerRef = createRef<HTMLDivElement>();

  constructor(props: GroupChatPageProps) {
    super(props);
    this.state = {
      group: null,
      messages: [],
      newMessage: "",
      loading: true,
      error: null,
    };
  }

  async componentDidMount() {
    await this.loadGroupAndMessages();
    this.initSocket();
  }

  componentDidUpdate(prevProps: GroupChatPageProps) {
    if (prevProps.token !== this.props.token || 
        prevProps.isAuthLoading !== this.props.isAuthLoading ||
        prevProps.params.groupId !== this.props.params.groupId) {
      this.loadGroupAndMessages();
      this.initSocket();
    }
  }

  componentWillUnmount() {
    this.disconnectSocket();
  }

  loadGroupAndMessages = async () => {
    const { groupId } = this.props.params;
    const { token, isAuthLoading } = this.props;

    if (isAuthLoading) return;
    if (!token) {
      this.setState({ 
        loading: false,
        error: "You must be logged in to view this chat"
      });
      return;
    }

    try {
      this.setState({ loading: true, error: null });
      const [group, messages] = await Promise.all([
        fetchGroup(token, Number(groupId)),
        fetchMessages(token, Number(groupId))
      ]);
      
      const processedMessages = messages.map((msg: any) => ({
        ...msg,
        createdAt: this.normalizeDate(msg.createdAt)
      }));
      
      this.setState({ group, messages: processedMessages }, () => {
        this.scrollToBottom(true);
      });
    } catch (err) {
      console.error(err);
      this.setState({ error: "Failed to load group or messages" });
      toast.error("Failed to load group or messages");
    } finally {
      this.setState({ loading: false });
    }
  };

  normalizeDate = (dateString: string): string => {
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) return dateString;
    
    const timestamp = Date.parse(dateString);
    if (!isNaN(timestamp)) return new Date(timestamp).toISOString();
    
    console.warn(`Invalid date string: ${dateString}, using current time instead`);
    return new Date().toISOString();
  };

  initSocket = () => {
    const { groupId } = this.props.params;
    const { token, isAuthLoading } = this.props;
    
    if (isAuthLoading || !token || !groupId) return;
    this.disconnectSocket();

    this.socket = io(import.meta.env.VITE_API_BASE_URL, { 
      auth: { token },
      transports: ["websocket"]
    });

    this.socket.on("connect", () => {
      this.socket?.emit("joinGroup", Number(groupId));
    });

    this.socket.on("newMessage", (msg: Message) => {
      // Skip if this is our own optimistic message
      if (!msg.tempId && !this.state.messages.some(m => 
        m.id === msg.id || 
        (m.tempId && m.text === msg.text && m.sender.id === msg.sender.id)
      )) {
        this.handleNewMessage({
          ...msg,
          createdAt: this.normalizeDate(msg.createdAt)
        });
      }
    });
    
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
      () => this.scrollToBottom()
    );
  };

  scrollToBottom = (instant = false) => {
    const container = this.messagesContainerRef.current;
    const endMarker = this.messagesEndRef.current;
    
    if (container && endMarker) {
      if (instant) {
        endMarker.scrollIntoView();
      } else {
        // Only scroll if user is near the bottom
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        
        if (distanceFromBottom < 200) {
          endMarker.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  handleSendMessage = async () => {
    const { newMessage } = this.state;
    const { token, user } = this.props;
    const { groupId } = this.props.params;

    if (!newMessage.trim()) {
      toast.error("Cannot send an empty message");
      return;
    }

    if (!token || !user) {
      toast.error("You must be logged in to send messages");
      return;
    }

    // Create optimistic message
    const tempMessage: Message = {
      id: -1,
      tempId: `temp-${Date.now()}`,
      text: newMessage.trim(),
      sender: user,
      createdAt: new Date().toISOString(),
      isSending: true
    };

    this.setState(prev => ({
      messages: [...prev.messages, tempMessage],
      newMessage: ""
    }), () => this.scrollToBottom());

    try {
      const message = await sendMessage(token, Number(groupId), newMessage.trim());
      
      // Replace temporary message with real one
      this.setState(prev => ({
        messages: prev.messages.map(msg => 
          msg.tempId === tempMessage.tempId 
            ? { ...message, createdAt: this.normalizeDate(message.createdAt) }
            : msg
        )
      }));
    } catch (err: any) {
      console.error(err);
      
      // Mark message as failed
      this.setState(prev => ({
        messages: prev.messages.map(msg => 
          msg.tempId === tempMessage.tempId 
            ? { ...msg, isSending: false, text: `${msg.text} (Failed to send)` }
            : msg
        )
      }));
      
      toast.error(err.response?.data?.error || "Failed to send message");
    }
  };

  handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSendMessage();
    }
  };

  formatMessageTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) return format(date, 'h:mm a');
      return format(new Date(dateString), 'h:mm a');
    } catch (e) {
      console.warn("Failed to format date:", dateString, e);
      return "Just now";
    }
  };

  render() {
    const { group, messages, newMessage, loading, error } = this.state;
    const { user, isAuthLoading } = this.props;

    if (isAuthLoading) return <Loading />;
    if (error) return <div className="p-6 text-destructive">{error}</div>;
    if (loading) return <Loading />;
    if (!group) return <div className="p-6">Group not found</div>;
    if (!user) return <div className="p-6">User not authenticated</div>;

    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        {/* Header */}
        <div className="p-4 bg-glass border-b border-border shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-xl md:text-2xl font-bold text-gradient-primary bg-clip-text">
              {group.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
          </div>
        </div>

        {/* Messages with custom scrollbar */}
        <div 
          ref={this.messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 max-w-4xl w-full mx-auto scrollbar scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <svg
                className="w-12 h-12 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.tempId || msg.id}
                className={`flex ${
                  msg.sender.id === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2 shadow-soft transition-opacity ${
                    msg.sender.id === user.id
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-accent text-accent-foreground rounded-bl-none"
                  } ${msg.isSending ? 'opacity-80' : ''}`}
                >
                  {msg.sender.id !== user.id && (
                    <div className="font-medium text-xs text-muted-foreground">
                      {msg.sender.name}
                    </div>
                  )}
                  <div className="mt-1 break-words">{msg.text}</div>
                  <div className="flex items-center justify-between">
                    <div className={`text-xs mt-1 ${
                      msg.sender.id === user.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {msg.isSending ? 'Sending...' : this.formatMessageTime(msg.createdAt)}
                    </div>
                    {msg.isSending && (
                      <div className="ml-2">
                        <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={this.messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-glass border-t border-border sticky bottom-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full border border-border rounded-full py-3 px-5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
                value={newMessage}
                placeholder="Type your message..."
                onChange={(e) => this.setState({ newMessage: e.target.value })}
                onKeyDown={this.handleKeyDown}
              />
              {!newMessage && (
                <div className="absolute right-3 top-3 text-muted-foreground">
                  <kbd className="px-2 py-1 text-xs rounded bg-muted">Enter</kbd>
                </div>
              )}
            </div>
            <button
              className="bg-blue-500 text-primary-foreground rounded-full p-3 shadow-soft hover:shadow-glow transition-all disabled:opacity-50"
              onClick={this.handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouterAndAuth(GroupChatPage);