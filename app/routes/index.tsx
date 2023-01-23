import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { ActionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useFetcher } from "@remix-run/react";
import clsx from "clsx";
import { verifyMessage } from "ethers/lib/utils";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import type { Env } from "~/types";

type Result = {
  success: boolean;
  error?: string;
};

export async function action({ request, context }: ActionArgs) {
  const form = await request.formData();
  const data = form.get("data")?.toString();
  const response = form.get("response")?.toString();
  if (!data || !response) {
    return json<Result>({ success: false, error: "Missing fields" });
  }

  const address = verifyMessage(response, data);
  if (address === response) {
    return json<Result>({
      success: false,
      error: "Current and new address are the same",
    });
  }

  const env = context as Env;
  await env.ATLAS_MINE_HARVESTER_PARTS.put(address, response);
  return json<Result>({ success: true });
}

export default function Index() {
  const fetcher = useFetcher();
  const [response, setResponse] = useState("");
  const { isConnected } = useAccount();
  const { isLoading: isSigning, signMessage } = useSignMessage({
    onSuccess(data, variables) {
      fetcher.submit(
        {
          data,
          response: variables.message.toString(),
        },
        {
          action: "/?index",
          method: "post",
        }
      );
    },
  });

  const handleSubmit = () => {
    signMessage({ message: response });
  };

  const data = fetcher.data as Result | undefined;
  const isLoading = fetcher.state !== "idle";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Treasure Form</h1>
        <ConnectButton showBalance={false} />
      </header>
      <div>
        <h2 className="font-semibold">Atlas Mine 12-Month Stakers</h2>
        <p className="text-sm">
          Use the form below if you plan to move your MAGIC holdings from an
          address that staked in the Atlas Mine with a 12-month lock period to
          another address. This will ensure that the correct address receives
          the Atlas Mine Harvester Part airdrop.
        </p>
        {data && (
          <p
            className={clsx(
              "mt-4 flex items-center gap-1 rounded border p-3",
              data.success
                ? "border-green-700 bg-green-200 text-green-700"
                : "border-red-700 bg-red-200 text-red-700"
            )}
          >
            {data.success ? (
              "Your response has been recorded"
            ) : (
              <>
                <span className="font-medium">An error occurred:</span>{" "}
                {data.error}
              </>
            )}
          </p>
        )}
        {(!data || !data.success) && (
          <div className="mt-4">
            <label className="block font-semibold">New Address:</label>
            <input
              className="w-full rounded"
              type="text"
              placeholder="0x0000000000000000000000000000000000000000"
              minLength={42}
              maxLength={42}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
            <div className="mt-2">
              {isConnected ? (
                <button
                  type="submit"
                  className="rounded bg-ruby-900 px-3 py-1.5 font-medium text-white transition-colors hover:bg-ruby-1000 disabled:opacity-50"
                  disabled={isSigning || isLoading}
                  onClick={handleSubmit}
                >
                  {isSigning
                    ? "Signing..."
                    : isLoading
                    ? "Submitting..."
                    : "Sign & Submit"}
                </button>
              ) : (
                <ConnectButton />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
