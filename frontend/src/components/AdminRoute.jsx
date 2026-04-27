import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const isAdmin = localStorage.getItem("is_admin") === "1";
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
