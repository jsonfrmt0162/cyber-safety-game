// src/services/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cyber-safety-api.onrender.com";

export const api = axios.create({
    baseURL: API_BASE_URL,
  });

// Auth
export const login = (email, password) =>
  api.post("/users/login", { email, password }).then((res) => res.data);

export const register = (data) =>
  api.post("/users/register", data).then((res) => res.data);

// Dashboard
export const getUserDashboard = (userId) =>
  api.get(`/game/dashboard/${userId}`).then((res) => res.data);

export const getGlobalLeaderboard = () =>
  api.get("/game/leaderboard").then((res) => res.data);

export const getGames = () =>
  api.get("/game/list").then((res) => res.data);

// Scores
export const submitScore = (payload) =>
  api.post("/scores/", payload).then((res) => res.data);

export const getGameLeaderboard = (gameId) =>
  api.get(`/scores/leaderboard/${gameId}`).then((res) => res.data);

export const getUserProgress = (userId) =>
  api.get(`/scores/progress/${userId}`).then((res) => res.data);
