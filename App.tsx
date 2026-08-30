import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {ChatPrototype} from './src/features/chat/screens/ChatPrototype';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <ChatPrototype />
    </SafeAreaProvider>
  );
}

export default App;
