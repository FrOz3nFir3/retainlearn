import { UserCircleIcon } from "@heroicons/react/24/outline";
import AuthTabs from "./AuthTabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import GuestAccessNote from "./GuestAccessNote";
import SocialAuthDivider from "./SocialAuthDivider";
import LoginByGoogle from "./LoginByGoogle";
import AuthAgreementNotice from "./ui/AuthAgreementNotice";

const AuthFormCard = ({ isLogin, onTabChange }) => {
  return (
    <div className="sticky top-8 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-surface dark:bg-white/8 flex items-center justify-center mb-4">
          <UserCircleIcon className="w-5 h-5 text-brand-primary dark:text-brand-accent/80" />
        </div>
        <h2 className="font-heading text-2xl text-gray-900 dark:text-white mb-1">
          {isLogin ? "Welcome back." : "Start learning."}
        </h2>
        <p className="text-sm text-gray-500 dark:text-white/45">
          {isLogin ? "Sign in to continue your progress." : "Create your free account today."}
        </p>
      </div>

      <GuestAccessNote />

      <div className="mb-6">
        <AuthTabs isLogin={isLogin} onTabChange={onTabChange} />
      </div>

      {isLogin ? <LoginForm /> : <RegisterForm />}

      <div className="mt-6 space-y-5">
        <SocialAuthDivider />
        <LoginByGoogle />
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/6">
        <AuthAgreementNotice />
      </div>
    </div>
  );
};

export default AuthFormCard;
