import { useState, useCallback } from "react";
import { IndexFundContract, IndexFundTokenContract } from "@/config";
import { AssetInfo } from "@/types";

export interface Asset {
  name: string;
  contract_address: string;
  weight: number;
}

interface GetFetchAssetsResult {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
}

export const useGetFetchAssets = (wallet: any): GetFetchAssetsResult => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!wallet) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: any = await wallet.viewMethod({
        contractId: IndexFundTokenContract,
        method: "get_assets",
        args: {},
      });

      const result: AssetInfo[] = decodeResult(response.result.result);
      setAssets(result);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      setError("Failed to fetch assets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  return { assets, isLoading, error, fetchAssets };
};
