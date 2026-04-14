import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { SocketProvider } from './src/context/SocketContext';

function App() {
  return (
    <SafeAreaProvider>
      <SocketProvider>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </SocketProvider>
    </SafeAreaProvider>
  );
}

export default App;
