import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const isAdmin = localStorage.getItem("is_admin") === "1";
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}
