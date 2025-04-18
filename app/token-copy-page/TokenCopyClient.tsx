"use client";

import { useState } from "react";

export default function TokenCopyClient({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
  };

  return (
    <div className="max-w-md w-full space-y-6 text-center">
      <h1 className="text-2xl font-bold">🎉 Logged In!</h1>
      <p className="text-muted-foreground">
        Copy this token and paste it into your app or extension:
      </p>
      <pre
        className="bg-muted p-4 rounded text-left overflow-x-auto break-words text-sm"
        style={{ userSelect: "all" }}
      >
        {token}
      </pre>

      <button
        onClick={handleCopy}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
      >
        {copied ? "✅ Token Copied!" : "📋 Copy Token"}
      </button>
    </div>
  );
}
