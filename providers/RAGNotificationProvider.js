import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const RAGNotificationContext = createContext({});

export const useRAGNotification = () => {
  const context = useContext(RAGNotificationContext);
  if (!context) {
    throw new Error('useRAGNotification must be used within RAGNotificationProvider');
  }
  return context;
};

export const RAGNotificationProvider = ({ children }) => {
  const [operations, setOperations] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Auto-hide notification after all operations complete
  useEffect(() => {
    if (operations.length === 0 && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 1000); // Keep visible for 1 second after completion
      return () => clearTimeout(timer);
    } else if (operations.length > 0) {
      setIsVisible(true);
    }
  }, [operations, isVisible]);

  const startOperation = useCallback((operationId, message = 'Updating AI knowledge...') => {
    console.log(`[RAG Notification] Starting operation: ${operationId} - ${message}`);
    setOperations(prev => {
      // Prevent duplicate operations
      if (prev.find(op => op.id === operationId)) {
        return prev;
      }
      return [...prev, { id: operationId, message, startTime: Date.now() }];
    });
  }, []);

  const endOperation = useCallback((operationId) => {
    console.log(`[RAG Notification] Ending operation: ${operationId}`);
    setOperations(prev => prev.filter(op => op.id !== operationId));
  }, []);

  const updateOperationMessage = useCallback((operationId, message) => {
    setOperations(prev => 
      prev.map(op => 
        op.id === operationId ? { ...op, message } : op
      )
    );
  }, []);

  // Get the current message to display
  const currentMessage = operations.length > 0 
    ? operations[0].message 
    : 'AI knowledge updated';

  const contextValue = {
    startOperation,
    endOperation,
    updateOperationMessage,
    isVisible,
    currentMessage,
    operationCount: operations.length,
  };

  return (
    <RAGNotificationContext.Provider value={contextValue}>
      {children}
    </RAGNotificationContext.Provider>
  );
}; 