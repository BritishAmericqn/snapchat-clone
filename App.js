import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";

import { RootNavigator } from "./navigation/RootNavigator";
import { AuthenticatedUserProvider, RAGNotificationProvider } from "./providers";
import { RAGNotification } from "./components";

const App = () => {
  return (
    <PaperProvider>
      <AuthenticatedUserProvider>
        <RAGNotificationProvider>
          <SafeAreaProvider>
            <RootNavigator />
            <RAGNotification />
          </SafeAreaProvider>
        </RAGNotificationProvider>
      </AuthenticatedUserProvider>
    </PaperProvider>
  );
};

export default App;
