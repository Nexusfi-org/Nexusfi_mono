import BigNumber from "bignumber.js";

interface Symbol {
  symbol: string;
  icon: string;
  percentange: number;
}

enum PythID {
  BTC = "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ETH = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  AURORA = "0x2f7c4f738d498585065a4b87b637069ec99474597da7f0ca349ba8ac3ba9cac5",
  USDC = "0x22c0d03a3fff6ce4c82caa81121f4a7f5c4924d2a0030c682dba8a294858e4dc",
  ARB = "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5",
  OP = "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf",
}

const processPriceData = (priceRaw: string, expo: number): number => {
  const price = new BigNumber(priceRaw);
  let finalPrice: BigNumber;

  if (expo >= 0) {
    finalPrice = price.multipliedBy(new BigNumber(10).pow(expo));
  } else {
    finalPrice = price.dividedBy(new BigNumber(10).pow(-expo));
  }

  return parseFloat(finalPrice.toFixed());
};

export const getIndexChange = async (symbols: Symbol[]): Promise<number> => {
  try {
    const totalPercentage = symbols.reduce((sum, s) => sum + s.percentange, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error("Total weights must equal 100%");
    }

    const priceChanges = await Promise.all(
      symbols.map(async (symbolData) => {
        const pythID = PythID[symbolData.symbol as keyof typeof PythID];
        if (!pythID) {
          throw new Error(`Invalid symbol: ${symbolData.symbol}`);
        }

        const timestamp24hAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

        const [currentPriceRes, historicalPriceRes] = await Promise.all([
          fetch(
            `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${pythID}`
          ),
          fetch(
            `https://hermes.pyth.network/v2/updates/price/${timestamp24hAgo}?ids%5B%5D=${pythID}`
          ),
        ]);

        const [currentPriceData, historicalPriceData] = await Promise.all([
          currentPriceRes.json(),
          historicalPriceRes.json(),
        ]);

        const currentPrice = processPriceData(
          currentPriceData.parsed[0].price.price,
          currentPriceData.parsed[0].price.expo
        );

        const price24hAgo = processPriceData(
          historicalPriceData.parsed[0].price.price,
          historicalPriceData.parsed[0].price.expo
        );

        if (symbolData.symbol === "USDT") {
          return 0 * (symbolData.percentange / 100);
        }

        const percentageChange =
          ((currentPrice - price24hAgo) / price24hAgo) * 100;
        return percentageChange * (symbolData.percentange / 100);
      })
    );

    return priceChanges.reduce((sum, change) => sum + change, 0);
  } catch (error) {
    console.error("Error calculating index change:", error);
    throw error;
  }
};

export const getIndexAPR = async (symbols: Symbol[]): Promise<number> => {
  try {
    const totalPercentage = symbols.reduce((sum, s) => sum + s.percentange, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error("Total weights must equal 100%");
    }

    // Get data for multiple time periods for more accurate calculation
    const now = Math.floor(Date.now() / 1000);
    const timePoints = [
      now - 90 * 24 * 60 * 60, // 90 days ago
      now - 60 * 24 * 60 * 60, // 60 days ago
      now - 30 * 24 * 60 * 60, // 30 days ago
    ];

    const returns = await Promise.all(
      symbols.map(async (symbolData) => {
        const pythID = PythID[symbolData.symbol as keyof typeof PythID];
        if (!pythID) {
          throw new Error(`Invalid symbol: ${symbolData.symbol}`);
        }

        // Get current price
        const currentPriceRes = await fetch(
          `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${pythID}`
        );
        const currentPriceData = await currentPriceRes.json();
        const currentPrice = processPriceData(
          currentPriceData.parsed[0].price.price,
          currentPriceData.parsed[0].price.expo
        );

        // Get historical prices
        const historicalPrices = await Promise.all(
          timePoints.map(async (timestamp) => {
            const res = await fetch(
              `https://hermes.pyth.network/v2/updates/price/${timestamp}?ids%5B%5D=${pythID}`
            );
            const data = await res.json();
            return processPriceData(
              data.parsed[0].price.price,
              data.parsed[0].price.expo
            );
          })
        );

        // Calculate returns for different periods
        const returns = historicalPrices.map((price) => {
          return ((currentPrice - price) / price) * 100;
        });

        // Handle stablecoins
        if (symbolData.symbol === "USDT") {
          return {
            symbol: symbolData.symbol,
            weight: symbolData.percentange / 100,
            returns: returns.map(() => 0), // Stablecoins have 0 return
          };
        }

        return {
          symbol: symbolData.symbol,
          weight: symbolData.percentange / 100,
          returns,
        };
      })
    );

    // Calculate weighted returns for each period
    const weightedReturns = returns[0].returns.map((_, periodIndex) => {
      return returns.reduce((sum, asset) => {
        return sum + asset.returns[periodIndex] * asset.weight;
      }, 0);
    });

    // Calculate annualized returns for each period
    const annualizedReturns = weightedReturns.map((return_, index) => {
      const days = [90, 60, 30][index];
      const periodsInYear = 365 / days;
      // Use compound interest formula to annualize: (1 + R)^n - 1
      return (Math.pow(1 + return_ / 100, periodsInYear) - 1) * 100;
    });

    // Take the average of the annualized returns for a more stable APR
    const apr =
      annualizedReturns.reduce((sum, r) => sum + r, 0) /
      annualizedReturns.length;

    // Limit extreme values
    const cappedAPR = Math.min(Math.max(apr, -100), 1000); // Cap between -100% and 1000%

    return cappedAPR;
  } catch (error) {
    console.error("Error calculating index APR:", error);
    throw error;
  }
};
