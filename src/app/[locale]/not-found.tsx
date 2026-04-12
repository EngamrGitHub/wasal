import { useTranslations } from "next-intl";
import Link from "next/link";

export default function UnauthorizedPage() {
  // const t = useTranslations("notfound"); // Or a specific error namespace

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-extrabold text-red-500">403</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {/* {t("accessDenied") || "Access Denied"} */}
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {/* {t("accessDeniedDesc") ||
            "You do not have permission to view this page. Please contact your administrator if you believe this is an error."}
         */}
         You do not have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="pt-4">
          <Link href="/">
            <button className="px-6 py-3 bg-teal text-white rounded-lg hover:bg-opacity-90 transition-colors font-cairo">
              {/* {t("backToHome") || "Back to Home"} */}
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
