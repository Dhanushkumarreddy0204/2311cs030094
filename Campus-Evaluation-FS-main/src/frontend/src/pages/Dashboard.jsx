import React, { useEffect } from "react";
import { Log } from "../../../logger";
import { fetchProducts } from "../api/products";

export const Dashboard = () => {
  useEffect(() => {
    Log("frontend", "info", "page", "Dashboard loaded");
    fetchProducts();
  }, []);

  return <div>Dashboard</div>;
};
