"use client";

import { useState } from "react";

export default function TokenCheckPage() {
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckToken() {
    setProfile(null);
    setError(null);

    if (!token) {
      setError("Paste a token first!");
      return;
    }

    try {
      const res = await fetch(
        "https://legbwjikylsjvcksnpwm.supabase.co/auth/v1/user",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlZ2J3amlreWxzanZja3NucHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2NTI4ODAsImV4cCI6MjA0NDIyODg4MH0.WZpNqAMU7xZdIVVNf5cMffIKJrsCHpQBOKE0mlE23m0",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">🔎 Check Token</h1>

        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your token here"
          className="w-full p-3 rounded border"
        />

        <button
          onClick={handleCheckToken}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
        >
          Check Token
        </button>

        {error && <div className="text-red-500 font-semibold">{error}</div>}

        {profile && (
          <pre className="bg-muted p-4 rounded text-left overflow-x-auto break-words text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
