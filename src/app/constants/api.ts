const REQUIRED_ENV_VARS = {
  DATA_URL: process.env.NEXT_PUBLIC_DATA_URL
} as const;

export const API = () => {
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
    if (!value) throw new Error(`Missing ${key} in env`);
  });

  return {
    data: {
      assets: REQUIRED_ENV_VARS.DATA_URL + "/assets",
      blockNumbers: (network: "mainnet" | "testnet") =>
        REQUIRED_ENV_VARS.DATA_URL + "/blocknumber/" + network,
    },
  };
};
