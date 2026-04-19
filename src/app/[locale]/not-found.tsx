import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-black text-primary opacity-20">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">
            {t("title")}
          </h2>
          <p className="text-gray-500 text-lg">
            {t("description")}
          </p>
        </div>
        <div className="pt-4">
          <Link href="/">
            <button className="px-8 py-4 bg-primary text-white rounded-full hover:opacity-90 transition-all font-bold shadow-lg">
              {t("button")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
