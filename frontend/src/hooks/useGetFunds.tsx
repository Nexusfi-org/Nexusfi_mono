import { useState, useCallback } from "react";
import { IndexFundContract } from "@/config";
import { Fund } from "@/types";

interface GetFundsParams {
  fromIndex?: number;
  limit?: number;
}

interface GetFundsResult {
  funds: [string, Fund][];
  isLoading: boolean;
  error: string | null;
  fetchFunds: (params?: GetFundsParams) => Promise<void>;
}

export const useGetFunds = (wallet: any): GetFundsResult => {
  const [funds, setFunds] = useState<[string, Fund][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunds = useCallback(
    async ({ fromIndex = 0, limit = 10 }: GetFundsParams = {}) => {
      if (!wallet) {
        setError("Wallet not connected");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response: any = await wallet.viewMethod({
          contractId: IndexFundContract,
          method: "get_funds",
          args: {
            from_index: fromIndex,
            limit,
          },
        });
        const result = decodeResult(response.result.result);
        setFunds(result);
      } catch (err) {
        console.error("Failed to fetch funds:", err);
        setError("Failed to fetch funds. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  return { funds, isLoading, error, fetchFunds };
};
