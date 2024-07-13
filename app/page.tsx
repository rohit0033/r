'use client';

import { useState, useEffect } from 'react';
import { initializeSocket, getSocket, disconnectSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    let mounted = true;

    if (isLoggedIn && token) {
      const setupSocket = async () => {
        try {
          const initializedSocket = await initializeSocket(token);
          if (mounted) {
            setSocket(initializedSocket);
            initializedSocket.on('userList', (users: string[]) => {
              setConnectedUsers(users);
            });
            initializedSocket.on('notification', (data: { from: string; message: string }) => {
              setNotifications(prev => [...prev, `${data.from}: ${data.message}`]);
            });
          }
        } catch (error) {
          console.error('Failed to initialize socket:', error);
        }
      };

      setupSocket();
    }

    return () => {
      mounted = false;
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.off('userList');
        currentSocket.off('notification');
      }
    };
  }, [isLoggedIn, token]);

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setIsLoggedIn(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login');
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', username, password }),
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration');
    }
  };

  const handlePing = (to: string) => {
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.emit('ping', { to });
    } else {
      console.error('Socket not initialized');
      alert('Cannot send ping: not connected to server');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    setConnectedUsers([]);
    setNotifications([]);
    disconnectSocket();
    setSocket(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login or Register</h1>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full p-3 mb-4 border rounded text-gray-700 bg-gray-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full p-3 mb-4 border rounded text-gray-700 bg-gray-100"
          />
          <div className="flex justify-between">
            <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">Login</button>
            <button onClick={handleRegister} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300">Register</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Real-Time Ping Notification System</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300">Logout</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Connected Users</h2>
            <ul className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
              {connectedUsers.map((user) => (
                <li 
                  key={user} 
                  onClick={() => handlePing(user)} 
                  className="cursor-pointer hover:bg-gray-200 p-2 rounded mb-2 transition duration-300"
                >
                  {user}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handlePing('all')} 
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
            >
              Ping All
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Notifications</h2>
            <ul className="bg-gray-100 p-4 rounded-lg max-h-60 overflow-y-auto">
              {notifications.map((notification, index) => (
                <li key={index} className="p-2 mb-2 bg-white rounded shadow">{notification}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}