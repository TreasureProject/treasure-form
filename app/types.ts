export type Env = {
  NODE_ENV: "development" | "production";
  ATLAS_MINE_HARVESTER_PARTS: KVNamespace;
};

export type Optional<T> = T | undefined;
