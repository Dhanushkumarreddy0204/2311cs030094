import { Log } from "../../../logger";

export const fetchProducts = async () => {
  await Log("frontend", "info", "api", "Fetching products");
  return [{ id: 1, name: "Product 1" }];
};
