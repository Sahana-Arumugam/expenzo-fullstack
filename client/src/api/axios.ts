import axios from "axios";

const API = axios.create({
  baseURL: "/api",  // works both locally and on Vercel
});

export default API;
