import { useEffect, useState } from "react";
import { Log } from "../../../logger";

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    Log("frontend", "debug", "hook", "useAuth initialized");
  }, []);

  return { user, setUser };
};
