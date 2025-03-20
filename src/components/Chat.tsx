import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Message {
  text: string;
  sender: string;
  receiver: string;
  timestamp: number;
}

const Chat = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sendMessage, setSendMessage] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    room: generateRoomId(),
  });

  // Generate a random 6-character room ID
  function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.room);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.room.trim()) return;

    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        {
          text: messageData.message,
          sender: messageData.sender,
          receiver: messageData.receiver || "Everyone",
          timestamp: Date.now(),
        },
      ]);
    };

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          data: {
            name: formData.name,
            message: [],
            room: formData.room,
          },
        })
      );
      setIsJoined(true);
    };

    ws.onerror = (event) => {
      console.error("WebSocket error:", event);
    };

    wsRef.current = ws;
  };

  const handleLeave = () => {
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "leave",
          data: {
            name: formData.name,
            message: [],
            room: formData.room,
          },
        })
      );
      wsRef.current.close();
      setIsJoined(false);
      navigate("/");
    }
  };

  const handleSendMessage = () => {
    if (wsRef.current && sendMessage.trim()) {
      const newMessage = {
        text: sendMessage,
        sender: formData.name,
        receiver: "Everyone",
        timestamp: Date.now(),
      };

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          data: {
            message: sendMessage,
            name: formData.name,
            receiver: "Everyone",
          },
        })
      );

      setMessages((prev) => [...prev, newMessage]);
      setSendMessage("");
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        handleLeave();
      }
    };
  }, []);

  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="flex justify-center mb-6 space-x-4">
            <button
              onClick={() => setIsCreatingRoom(true)}
              className={`px-4 py-2 rounded-md ${
                isCreatingRoom
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setIsCreatingRoom(false)}
              className={`px-4 py-2 rounded-md ${
                !isCreatingRoom
                  ? "bg-purple-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Join Room
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-center">
            {isCreatingRoom ? "Create Chat Room" : "Join Chat Room"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Room Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      room: e.target.value.toUpperCase(),
                    })
                  }
                  readOnly={isCreatingRoom}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
                <div className="flex space-x-2 mt-1">
                  {isCreatingRoom && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, room: generateRoomId() })
                      }
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Generate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 relative"
                  >
                    {isCopied ? "Copied!" : "Copy"}
                    {isCopied && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        Copied to clipboard!
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              {isCreatingRoom ? "Create Room" : "Join Room"}
            </button>
          </form>
        </div>
      </div>
    );
  }
  console.log(messages);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Room: </span>
          <span className="font-semibold">{formData.room}</span>
          <button
            onClick={copyToClipboard}
            className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 relative"
          >
            {isCopied ? "Copied!" : "Copy"}
            {isCopied && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                Copied to clipboard!
              </div>
            )}
          </button>
        </div>
        <button
          onClick={handleLeave}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Leave Room
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === formData.name ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex flex-col max-w-[70%]">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1 px-2">
                <span className="font-medium">
                  {message.sender === formData.name ? "You" : message.sender}
                </span>
                <span>→</span>
                <span className="font-medium">{message.receiver}</span>
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender === formData.name
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-800"
                }`}
              >
                <div>{message.text}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1 px-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 shadow-md">
        <div className="flex space-x-2">
          <input
            type="text"
            value={sendMessage}
            onChange={(e) => setSendMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          />
          <button
            onClick={handleSendMessage}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
