import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI, roomsAPI, usersAPI } from '../../services/api';
import socketService from '../../services/socket';
import './Chat.css';

const ChatWindow = () => {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { type: 'room'|'private', id, name }
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [fileUploading, setFileUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial data
  useEffect(() => {
    loadRooms();
    loadUsers();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    // New message received
    socketService.onNewMessage((message) => {
      if (activeChat?.type === 'room' && message.roomId === activeChat.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Private message received
    socketService.onPrivateMessage((message) => {
      const isFromActiveChat = activeChat?.type === 'private' &&
        (message.sender_id === activeChat.id || message.receiver_id === activeChat.id);

      if (isFromActiveChat) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Typing indicators
    socketService.onTypingUpdate((data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => [...new Set([...prev, data.username])]);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }
    });

    socketService.onTypingUpdatePrivate((data) => {
      if (data.isTyping) {
        setTypingUsers([data.username]);
      } else {
        setTypingUsers([]);
      }
    });

    // User status updates
    socketService.onUserStatus((data) => {
      setOnlineUsers((prev) => {
        if (data.isOnline) {
          return [...new Set([...prev, data.userId])];
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    });

    socketService.onOnlineUsers((userIds) => {
      setOnlineUsers(userIds);
    });

    return () => {
      socketService.offNewMessage();
      socketService.offPrivateMessage();
      socketService.offTypingUpdate();
      socketService.offTypingUpdatePrivate();
      socketService.offUserStatus();
      socketService.offOnlineUsers();
    };
  }, [activeChat]);

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.getMyRooms();
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMessages = async (chat) => {
    try {
      setMessages([]);
      setTypingUsers([]);

      if (chat.type === 'room') {
        const response = await messagesAPI.getRoomMessages(chat.id);
        setMessages(response.data.messages);
        socketService.joinRoom(chat.id);
      } else {
        const response = await messagesAPI.getPrivateMessages(chat.id);
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleChatSelect = (chat) => {
    if (activeChat?.type === 'room') {
      socketService.leaveRoom(activeChat.id);
    }
    setActiveChat(chat);
    loadMessages(chat);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    const messageData = {
      content: messageInput,
      messageType: 'text',
    };

    if (activeChat.type === 'room') {
      socketService.sendMessage({
        ...messageData,
        roomId: activeChat.id,
      });
      socketService.stopTyping({ roomId: activeChat.id });
    } else {
      socketService.sendPrivateMessage({
        ...messageData,
        receiverId: activeChat.id,
      });
      socketService.stopTypingPrivate({ receiverId: activeChat.id });
    }

    setMessageInput('');
    clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!activeChat) return;

    // Send typing indicator
    if (activeChat.type === 'room') {
      socketService.startTyping({ roomId: activeChat.id });
    } else {
      socketService.startTypingPrivate({ receiverId: activeChat.id });
    }

    // Stop typing after 1 second of inactivity
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeChat.type === 'room') {
        socketService.stopTyping({ roomId: activeChat.id });
      } else {
        socketService.stopTypingPrivate({ receiverId: activeChat.id });
      }
    }, 1000);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await messagesAPI.uploadFile(formData);
      const { fileUrl, fileType } = response.data;

      const messageData = {
        content: file.name,
        messageType: fileType,
        fileUrl,
      };

      if (activeChat.type === 'room') {
        socketService.sendMessage({
          ...messageData,
          roomId: activeChat.id,
        });
      } else {
        socketService.sendPrivateMessage({
          ...messageData,
          receiverId: activeChat.id,
        });
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setFileUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      await roomsAPI.create({ name: newRoomName, isPrivate: false });
      setNewRoomName('');
      setShowNewRoomModal(false);
      loadRooms();
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await roomsAPI.join(roomId);
      loadRooms();
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Chat App</h2>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>

        <div className="user-info">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.username}</div>
            <div className="user-status">Online</div>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="sidebar-section">
          <div className="section-header">
            <h3>Rooms</h3>
            <button
              className="btn-icon"
              onClick={() => setShowNewRoomModal(true)}
              title="Create room"
            >
              +
            </button>
          </div>
          <div className="chat-list">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`chat-item ${activeChat?.type === 'room' && activeChat.id === room.id ? 'active' : ''}`}
                onClick={() => handleChatSelect({ type: 'room', id: room.id, name: room.name })}
              >
                <div className="chat-item-avatar">#</div>
                <div className="chat-item-info">
                  <div className="chat-item-name">{room.name}</div>
                  <div className="chat-item-meta">{room.member_count} members</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Section */}
        <div className="sidebar-section">
          <h3>Direct Messages</h3>
          <div className="chat-list">
            {users.map((u) => (
              <div
                key={u.id}
                className={`chat-item ${activeChat?.type === 'private' && activeChat.id === u.id ? 'active' : ''}`}
                onClick={() => handleChatSelect({ type: 'private', id: u.id, name: u.username })}
              >
                <div className="chat-item-avatar">{u.username[0].toUpperCase()}</div>
                <div className="chat-item-info">
                  <div className="chat-item-name">{u.username}</div>
                  <div className={`status-indicator ${onlineUsers.includes(u.id) ? 'online' : 'offline'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div>
                <h2>{activeChat.name}</h2>
                <p className="chat-header-meta">
                  {activeChat.type === 'room' ? 'Group chat' : onlineUsers.includes(activeChat.id) ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`message ${msg.sender_id === user.id ? 'message-sent' : 'message-received'}`}
                >
                  <div className="message-avatar">
                    {msg.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-sender">{msg.username}</span>
                      <span className="message-time">{formatTime(msg.created_at)}</span>
                    </div>
                    {msg.message_type === 'image' ? (
                      <img src={msg.file_url} alt="Shared" className="message-image" />
                    ) : msg.message_type === 'file' ? (
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="message-file">
                        📎 {msg.content}
                      </a>
                    ) : (
                      <div className="message-text">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form className="message-input-container" onSubmit={handleSendMessage}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={fileUploading}
                title="Upload file"
              >
                {fileUploading ? '...' : '📎'}
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="btn-send" disabled={!messageInput.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <h2>Welcome to Chat App!</h2>
            <p>Select a room or user to start chatting</p>
          </div>
        )}
      </div>

      {/* New Room Modal */}
      {showNewRoomModal && (
        <div className="modal-overlay" onClick={() => setShowNewRoomModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Room</h3>
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name"
                className="modal-input"
                autoFocus
              />
              <div className="modal-buttons">
                <button type="button" onClick={() => setShowNewRoomModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
