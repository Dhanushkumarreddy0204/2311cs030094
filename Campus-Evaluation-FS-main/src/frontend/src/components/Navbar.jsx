import React, { useEffect } from "react";
import { Log } from "../../../logger";

export const Navbar = () => {
  useEffect(() => {
    Log("frontend", "debug", "component", "Navbar rendered");
  }, []);

  return <nav>Navbar</nav>;
};
