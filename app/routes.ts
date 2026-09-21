import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("stats", "routes/stats.tsx"),
  route("wap", "routes/wap.tsx"),
] satisfies RouteConfig;
