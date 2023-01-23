import { useMemo, useEffect } from "react";
import type {
  LinksFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  useTransition,
  useFetchers,
  useLoaderData,
} from "@remix-run/react";
import { chain, createClient, WagmiConfig, configureChains } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import {
  connectorsForWallets,
  getDefaultWallets,
  lightTheme,
  RainbowKitProvider,
  wallet,
} from "@rainbow-me/rainbowkit";

import NProgress from "nprogress";

import type { Env } from "./types";

import rainbowStyles from "@rainbow-me/rainbowkit/styles.css";
import styles from "./styles/tailwind.css";
import nProgressStyles from "./styles/nprogress.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "stylesheet", href: nProgressStyles },
  { rel: "stylesheet", href: rainbowStyles },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/apple-touch-icon.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  {
    rel: "manifest",
    href: "/site.webmanifest",
  },
  {
    rel: "mask-icon",
    href: "/safari-pinned-tab.svg",
    color: "#dc2626",
  },
];

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  viewport: "width=device-width,initial-scale=1",
  "theme-color": "#ffffff",
  "msapplication-TileColor": "#ffc40d",
  title: "Treasure Form",
});

export const loader = async ({ context }: LoaderArgs) => {
  const { NODE_ENV } = context as Env;
  return json({
    NODE_ENV,
  });
};

export default function App() {
  const transition = useTransition();
  const { NODE_ENV } = useLoaderData<typeof loader>();

  const { chains, provider } = useMemo(
    () =>
      configureChains(
        // Configure this to chains you want
        [chain.arbitrum],
        [publicProvider()]
      ),
    []
  );

  const { wallets } = useMemo(
    () =>
      getDefaultWallets({
        appName: "Treasure Form",
        chains,
      }),
    [chains]
  );

  const connectors = useMemo(
    () =>
      connectorsForWallets([
        ...wallets,
        {
          groupName: "Others",
          wallets: [wallet.trust({ chains }), wallet.ledger({ chains })],
        },
      ]),
    [chains, wallets]
  );

  const client = useMemo(
    () =>
      createClient({
        autoConnect: true,
        connectors,
        provider,
      }),
    [connectors, provider]
  );

  const fetchers = useFetchers();

  const state = useMemo<"idle" | "loading">(
    function getGlobalState() {
      const states = [
        transition.state,
        ...fetchers.map((fetcher) => fetcher.state),
      ];
      if (states.every((state) => state === "idle")) return "idle";
      return "loading";
    },
    [transition.state, fetchers]
  );

  // slim loading bars on top of the page, for page transitions
  useEffect(() => {
    if (state === "loading") NProgress.start();
    if (state === "idle") NProgress.done();
  }, [state, transition.state]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-honey-25 antialiased">
        <WagmiConfig client={client}>
          <RainbowKitProvider
            chains={chains}
            theme={lightTheme({
              accentColor: "#DC2626",
              borderRadius: "small",
            })}
          >
            <Outlet />
          </RainbowKitProvider>
        </WagmiConfig>
        <Scripts />
        {NODE_ENV === "development" ? <LiveReload /> : null}
      </body>
    </html>
  );
}
