import React,{ useContext } from "react";
// Point this to your context file

export const AuthContext = React.createContext();
export const useAuth = () => useContext(AuthContext);