export default function page() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">🎉 Pro Activated!</h1>
      <p className="text-muted-foreground mb-6">
        Your Raivcoo profile is now verified and Pro features are unlocked.
      </p>
      <a href="/profile" className="underline font-medium text-blue-600">
        Go to your profile
      </a>
    </div>
  );
}
