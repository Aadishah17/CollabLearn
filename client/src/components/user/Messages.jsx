import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Send,
  Search,
  Video,
  Smile,
  MoreVertical,
  MessageSquare,
  Sparkles,
  CheckCheck,
  PhoneCall,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MainNavbar from '../../navbar/mainNavbar.jsx';
import Avatar from './Avatar.jsx';

import { API_URL as CONFIG_API_URL } from '../../config';

const SOCKET_SERVER_URL = CONFIG_API_URL;
const API_URL = `${CONFIG_API_URL}/api`;

const getLoggedInUserId = () => {
  return localStorage.getItem('userId');
};

const MessagesPage = () => {
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);
  const activeContactIdRef = useRef(activeContactId);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const saveContactOrder = (contactsList) => {
    try {
      const orderMap = {};
      contactsList.forEach((contact, index) => {
        orderMap[contact._id] = index;
      });
      localStorage.setItem('contactsOrder', JSON.stringify(orderMap));
    } catch {
      console.warn('Failed to save contact order to localStorage');
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'just now';
    } else if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  useEffect(() => {
    const userId = getLoggedInUserId();
    if (!userId) {
      console.error('No logged-in user found!');
      return;
    }
    setLoggedInUserId(userId);
  }, []);

  useEffect(() => {
    activeContactIdRef.current = activeContactId;
  }, [activeContactId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loggedInUserId) return;

    setLoadingContacts(true);
    fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((users) => {
        const filteredUsers = users.filter((user) => user._id !== loggedInUserId);

        const savedOrder = localStorage.getItem('contactsOrder');
        let userOrder = {};
        if (savedOrder) {
          try {
            userOrder = JSON.parse(savedOrder);
          } catch {
            console.warn('Failed to parse saved contacts order');
          }
        }

        const withMeta = filteredUsers.map((u, index) => ({
          ...u,
          latestMessage: '',
          lastMessageTime: null,
          lastSeen: null,
          _originalIndex: userOrder[u._id] !== undefined ? userOrder[u._id] : index,
        }));
        setContacts(withMeta);
        setLoadingContacts(false);
      })
      .catch(() => setLoadingContacts(false));
  }, [loggedInUserId]);

  useEffect(() => {
    if (!activeContactId || !loggedInUserId) {
      setMessages([]);
      return;
    }
    const chatId = [loggedInUserId, activeContactId].sort().join('_');
    fetch(`${API_URL}/messages/${chatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((msgs) => {
        setMessages(msgs);
      })
      .catch((err) => console.error('Failed to load messages:', err));
  }, [activeContactId, loggedInUserId]);

  useEffect(() => {
    if (!loggedInUserId) return;

    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('reconnect', () => {
      if (loggedInUserId) {
        socketRef.current.emit('user_online', loggedInUserId);
        socketRef.current.emit('get_online_users');
      }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('user_online', loggedInUserId);
      setTimeout(() => {
        socketRef.current.emit('get_online_users');
      }, 500);
    });

    const handleOnlineUsersList = (data) => {
      setOnlineUsers(new Set(data.onlineUsers));
    };

    const handleIncomingMessage = (msg) => {
      const currentActiveId = activeContactIdRef.current;
      const currentChatId = currentActiveId
        ? [loggedInUserId, currentActiveId].sort().join('_')
        : null;

      if (msg.senderId !== loggedInUserId && msg.chatId === currentChatId) {
        setMessages((prev) => [...prev, msg]);
        setIsTyping(false);
      }

      setContacts((prevContacts) =>
        prevContacts.map((c) => {
          if (msg.chatId.includes(c._id) && c._id !== loggedInUserId) {
            return {
              ...c,
              latestMessage: msg.text,
              lastMessageTime: msg.time,
            };
          }
          return c;
        })
      );
    };

    const handleUserStatusChange = (data) => {
      setOnlineUsers((prev) => {
        const newOnlineUsers = new Set(prev);
        if (data.isOnline) {
          newOnlineUsers.add(data.userId);
        } else {
          newOnlineUsers.delete(data.userId);
        }
        return newOnlineUsers;
      });
    };

    const handleUserTyping = (data) => {
      const currentActiveId = activeContactIdRef.current;
      const currentChatId = currentActiveId
        ? [loggedInUserId, currentActiveId].sort().join('_')
        : null;

      if (data.chatId === currentChatId && data.userId !== loggedInUserId) {
        setIsTyping(true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      const currentActiveId = activeContactIdRef.current;
      const currentChatId = currentActiveId
        ? [loggedInUserId, currentActiveId].sort().join('_')
        : null;

      if (data.chatId === currentChatId && data.userId !== loggedInUserId) {
        setIsTyping(false);
      }
    };

    socketRef.current.on('online_users_list', handleOnlineUsersList);
    socketRef.current.on('chat message', handleIncomingMessage);
    socketRef.current.on('user_status_change', handleUserStatusChange);
    socketRef.current.on('user typing', handleUserTyping);
    socketRef.current.on('user stopped typing', handleUserStoppedTyping);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('reconnect');
        socketRef.current.off('online_users_list', handleOnlineUsersList);
        socketRef.current.off('chat message', handleIncomingMessage);
        socketRef.current.off('user_status_change', handleUserStatusChange);
        socketRef.current.off('user typing', handleUserTyping);
        socketRef.current.off('user stopped typing', handleUserStoppedTyping);
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [loggedInUserId]);

  useEffect(() => {
    if (!activeContactId || !socketRef.current || !loggedInUserId) return;
    const chatId = [loggedInUserId, activeContactId].sort().join('_');
    socketRef.current.emit('joinRoom', chatId);

    setIsTyping(false);

    return () => {
      socketRef.current.emit('leaveRoom', chatId);
    };
  }, [activeContactId, loggedInUserId]);

  useEffect(() => {
    if (contacts.length > 0) {
      const timeoutId = setTimeout(() => {
        saveContactOrder(contacts);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [contacts]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeContactId || !loggedInUserId) return;

    const chatId = [loggedInUserId, activeContactId].sort().join('_');
    const newMessage = {
      chatId,
      senderId: loggedInUserId,
      text: messageInput.trim(),
      time: new Date().toISOString(),
    };

    socketRef.current.emit('chat message', newMessage);
    socketRef.current.emit('stopped typing', { chatId, userId: loggedInUserId });

    setMessages((prev) => [...prev, newMessage]);
    setContacts((prev) =>
      prev.map((c) =>
        c._id === activeContactId
          ? {
              ...c,
              latestMessage: newMessage.text,
              lastMessageTime: newMessage.time,
            }
          : c
      )
    );
    setMessageInput('');
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!activeContactId || !loggedInUserId) return;

    const chatId = [loggedInUserId, activeContactId].sort().join('_');
    socketRef.current.emit('typing', { chatId, userId: loggedInUserId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stopped typing', { chatId, userId: loggedInUserId });
    }, 2000);
  };

  const ChatBubble = ({ message }) => {
    if (!loggedInUserId) return null;

    const msgSenderId = String(message.senderId).trim();
    const loggedInId = String(loggedInUserId).trim();
    const isSent = msgSenderId === loggedInId;

    return (
      <div className={`flex mb-3.5 ${isSent ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-xs sm:max-w-md md:max-w-lg px-4 py-3 rounded-2xl text-sm transition-all duration-200 ${
            isSent
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-none shadow-lg shadow-red-950/40 border border-red-500/40'
              : 'surface-card border border-white/10 text-gray-200 rounded-tl-none backdrop-blur-md'
          }`}
        >
          <p className="leading-relaxed break-words">{message.text}</p>
          <div
            className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
              isSent ? 'text-red-200/80' : 'text-gray-500'
            }`}
          >
            <span>
              {new Date(message.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {isSent && <CheckCheck size={12} className="text-red-200" />}
          </div>
        </div>
      </div>
    );
  };

  if (!loggedInUserId) {
    return (
      <div className="min-h-screen glass-page flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedContacts = [...contacts]
    .filter((user) => (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;

      const aOnline = isUserOnline(a._id) ? 1 : 0;
      const bOnline = isUserOnline(b._id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;

      const nameComparison = (a.name || '').localeCompare(b.name || '');
      if (nameComparison !== 0) return nameComparison;

      return (a._originalIndex || 0) - (b._originalIndex || 0);
    });

  const activeContact = contacts.find((u) => u._id === activeContactId);

  return (
    <div className="min-h-screen glass-page flex flex-col font-sans relative overflow-hidden">
      <MainNavbar />

      {/* Atmospheric Glow */}
      <div className="pointer-events-none absolute top-20 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-[140px]"></div>
      <div className="pointer-events-none absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px]"></div>

      <div className="flex-1 flex overflow-hidden pt-20">
        {/* Contacts Sidebar */}
        <div className="w-full md:w-88 lg:w-96 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-[calc(100vh-80px)]">
          {/* Sidebar Header & Search */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <MessageSquare size={20} className="text-red-500" />
                <span>Messages</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-gray-400">
                {contacts.length} peers
              </span>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-red-500/60 placeholder:text-gray-600 transition-all"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loadingContacts ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-11 h-11 rounded-full bg-white/5"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-28 bg-white/5 rounded"></div>
                      <div className="h-2.5 w-40 bg-white/5 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs">No conversations found</div>
            ) : (
              sortedContacts.map((user) => {
                const userIsOnline = isUserOnline(user._id);
                const isActive = user._id === activeContactId;

                return (
                  <div
                    key={user._id}
                    onClick={() => setActiveContactId(user._id)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all duration-200 border-l-4 ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600/20 via-red-600/5 to-transparent border-red-500 text-white'
                        : 'border-transparent hover:bg-white/[0.04] text-gray-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar
                        src={user.avatar}
                        name={user.name}
                        size="md"
                        className="ring-2 ring-white/10"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
                          userIsOnline ? 'bg-emerald-400' : 'bg-gray-600'
                        }`}
                      ></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isActive ? 'text-white' : 'text-gray-200'
                          }`}
                        >
                          {user.name}
                        </h4>
                        {user.lastMessageTime && (
                          <span className="text-[10px] font-mono text-gray-500 flex-shrink-0">
                            {formatMessageTime(user.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {user.latestMessage || (userIsOnline ? 'Online now' : 'Click to chat')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Conversation Stage */}
        <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-xl h-[calc(100vh-80px)] overflow-hidden">
          {activeContact ? (
            <>
              {/* Chat Active Header */}
              <div className="h-18 px-6 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      src={activeContact.avatar}
                      name={activeContact.name}
                      size="md"
                      className="ring-2 ring-red-500/30 shadow-md"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
                        isUserOnline(activeContactId) ? 'bg-emerald-400' : 'bg-gray-600'
                      }`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      {activeContact.name}
                    </h3>
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isUserOnline(activeContactId)
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-gray-500'
                        }`}
                      ></span>
                      {isUserOnline(activeContactId) ? 'Active now' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Quick Direct Video Call Launcher */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/videocall?roomID=${[loggedInUserId, activeContactId].sort().join('')}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/40 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
                    title="Start 1-on-1 Video Session"
                  >
                    <Video size={15} className="text-red-400" />
                    <span>Video Call</span>
                  </Link>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-6 overflow-y-auto space-y-1">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-3">
                      <MessageSquare size={24} />
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">
                      No messages in this channel yet
                    </h4>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Say hello to {activeContact.name} and begin scheduling your collaborative
                      study session!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <ChatBubble key={msg._id || idx} message={msg} index={idx} />
                  ))
                )}

                {/* Typing status bubble */}
                {isTyping && (
                  <div className="flex justify-start mb-2">
                    <div className="surface-card px-4 py-2.5 rounded-2xl rounded-tl-none border border-white/10 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></span>
                      <span
                        className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></span>
                      <span
                        className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      ></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-xl flex items-center gap-3 flex-shrink-0"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Message ${activeContact.name}...`}
                    value={messageInput}
                    onChange={handleInputChange}
                    className="w-full pl-4 pr-10 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/60 placeholder:text-gray-600 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="glass-cta px-5 py-3 rounded-xl text-white flex items-center gap-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-lg"
                >
                  <span>Send</span>
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation is selected */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                <Sparkles size={36} />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">
                CollabLearn Peer Messenger
              </h3>
              <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">
                Connect with mentors, study buddies, and instructors in real-time. Select a
                conversation from the sidebar to start discussing code, projects, and learning
                goals.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Live Socket Sync
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Video size={13} className="text-red-400" /> HD Video Ready
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
