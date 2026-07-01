import React, { createContext, useEffect } from "react";
import { Log } from "../../../logger";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  useEffect(() => {
    Log("frontend", "info", "state", "User logged in");
  }, []);

  return (
    <AuthContext.Provider value={{ user: "Test User" }}>
      {children}
    </AuthContext.Provider>
  );
};
