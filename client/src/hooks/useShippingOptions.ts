import { useQuery } from "@tanstack/react-query";
import { fetchShippingOptions } from "../api/shipping";

export const useShippingOptions = () => useQuery({
  queryKey: ["shipping-options"],
  queryFn: fetchShippingOptions,
  staleTime: 30 * 60 * 1000,
});
