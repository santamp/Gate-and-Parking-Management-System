import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const baseUrl = API_BASE_URL.split('/api')[0];
        
        const newSocket = io(baseUrl, {
            auth: { token },
            transports: ['websocket', 'polling'], // Fallback included
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('📶 Connected to real-time server:', newSocket.id);
        });

        newSocket.on('disconnect', () => {
            console.log('📶 Disconnected from real-time server');
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
