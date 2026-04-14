import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../services/api';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let activeSocket;

    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('token');

      activeSocket = io(SOCKET_BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      activeSocket.on('connect', () => {
        console.log('Mobile socket connected:', activeSocket.id);
      });

      activeSocket.on('disconnect', () => {
        console.log('Mobile socket disconnected');
      });

      activeSocket.on('connect_error', (error) => {
        console.log('Mobile socket connection error:', error.message);
      });

      setSocket(activeSocket);
    };

    connectSocket();

    return () => {
      activeSocket?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
