import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {                                  // I dont understand any of this file - Luke
  username: string;
  email: string;
}
       
interface LoginContextType {           
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const LoginContext = createContext<LoginContextType | undefined>(undefined);     // creates contexts object (used to pass data throught the different files)

interface LoginProviderProps {
  children: ReactNode;
}

export const LoginProvider: React.FC<LoginProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    };
    loadUser();
  }, []);

  const login = async (userData: User) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <LoginContext.Provider value={{ user, login, logout }}>
      {children}
    </LoginContext.Provider>
  );
};

export const useAuth = (): LoginContextType => {
  const context = useContext(LoginContext);
  if (!context) {
    throw new Error('useAuth must be used within a LoginProvider');
  }
  return context;
};



