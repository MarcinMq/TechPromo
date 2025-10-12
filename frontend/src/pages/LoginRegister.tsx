import { useState } from "react";

export default function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-8">
        <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-6 text-center">
          {isLogin ? "Logowanie" : "Rejestracja"}
        </h2>
        <form className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Nick" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-colors" />
          )}
          <input type="email" placeholder="Email" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-colors" />
          <input type="password" placeholder="Hasło" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 transition-colors" />
          <button type="submit" className="w-full py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold">
            {isLogin ? "Zaloguj się" : "Zarejestruj się"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setIsLogin((v) => !v)}
          >
            {isLogin ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
          </button>
        </div>
      </div>
    </main>
  );
}
