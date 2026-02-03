/**
 * Route type definitions for QTS Dashboard.
 */

export interface Route {
  id: string;
  name: string;
  status: "active" | "inactive" | "maintenance";
  origin: string;
  destination: string;
  updatedAt: string;
}

export type RouteStatus = Route["status"];
