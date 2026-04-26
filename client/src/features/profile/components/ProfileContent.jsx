import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useGoogleLogin } from "@react-oauth/google";
import { usePatchUpdateUserProfileMutation } from "../../../api/apiSlice";
import ProfileSkeleton from "../../../components/ui/skeletons/ProfilePageSkeleton";
import {
  selectCurrentUser,
  updateUserProfile,
} from "../../authentication/state/authSlice";
import RestrictedAccess from "../../../components/ui/RestrictedAccess";
import { Link } from "react-router-dom";
import {
  UserCircleIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EnvelopeIcon,
  UserIcon,
  AtSymbolIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const inputClass =
  "w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-accent/20 focus:border-brand-primary dark:focus:border-brand-accent/40 transition-all duration-200";

const ProfileContent = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [updateUser, { isLoading, error: apiError }] =
    usePatchUpdateUserProfileMutation();

  const nameRef = useRef(user?.name);
  const usernameRef = useRef(user?.username);
  const emailRef = useRef(user?.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    const newName = nameRef.current.value;
    const newUsername = usernameRef.current.value;
    const newEmail = emailRef.current.value;

    if (newName !== user.name) payload.name = newName;
    if (newUsername !== user.username) payload.username = newUsername;
    if (newEmail !== user.email) payload.email = newEmail;

    if (Object.keys(payload).length === 0) return;

    updateUser(payload).then((response) => {
      if (response.error) return;
      dispatch(updateUserProfile(payload));
      setIsEditing(false);
    });
  };

  const handleGoogleConnectSuccess = async (tokenResponse) => {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const googleUser = await response.json();
      const updatedUser = { googleId: googleUser.sub };
      const { error } = await updateUser(updatedUser);
      if (error) return;
      dispatch(updateUserProfile(updatedUser));
    } catch {}
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleConnectSuccess,
    onError: () => {},
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!user)
    return <RestrictedAccess description="You need to be logged in to view your profile" />;

  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-3">
            Your account
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl text-gray-900 dark:text-white leading-tight">
            Account settings.
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/45 mt-2">
            Manage your profile and connected accounts.
          </p>
        </div>

        {/* Error */}
        {apiError && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-500/20 rounded-xl mb-8">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">
              {apiError?.data?.error || "Something went wrong. Please try again."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-surface dark:bg-white/8 flex items-center justify-center">
                  <UserCircleIcon className="w-4 h-4 text-brand-primary dark:text-brand-accent/80" />
                </div>
                <div>
                  <h2 className="font-heading text-lg text-gray-900 dark:text-white">Profile information</h2>
                  <p className="text-xs text-gray-400 dark:text-white/30">Your public and personal details</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/50 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            <div className="p-8">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2">
                        Full name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          ref={nameRef}
                          defaultValue={user.name}
                          placeholder="Your full name"
                          className={inputClass}
                        />
                        <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          ref={usernameRef}
                          defaultValue={user.username}
                          placeholder="Your username"
                          className={inputClass}
                        />
                        <AtSymbolIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20 pointer-events-none" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          ref={emailRef}
                          defaultValue={user.email}
                          placeholder="Your email"
                          className={inputClass}
                        />
                        <EnvelopeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-white/20 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="cursor-pointer flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark dark:disabled:bg-white/10 dark:disabled:text-white/25 text-white font-semibold text-sm rounded-xl transition-colors duration-150"
                    >
                      {isLoading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                      {isLoading ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1.5">Full name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{user.name || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1.5">Username</p>
                    <Link
                      to={`/profile/${user.username}`}
                      className="text-brand-primary dark:text-brand-accent hover:underline font-medium"
                    >
                      @{user.username}
                    </Link>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-1.5">Email address</p>
                    <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connected accounts sidebar */}
          <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden h-fit">
            {/* Card header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/6">
              <div className="w-8 h-8 rounded-lg bg-brand-surface dark:bg-white/8 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-brand-primary dark:text-brand-accent/80" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-gray-900 dark:text-white">Connected accounts</h3>
                <p className="text-xs text-gray-400 dark:text-white/30">Link social accounts for quick sign-in</p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {/* Google */}
              <div className="p-4 bg-gray-50 dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-white dark:bg-white/10 rounded-lg shadow-sm flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div className="grow min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Google</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">Sign in with Google</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {user.googleId ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Connected</span>
                    </div>
                  ) : (
                    <>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-white/6 rounded-lg">
                        <XCircleIcon className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                        <span className="text-xs font-medium text-gray-500 dark:text-white/40">Not linked</span>
                      </div>
                      <button
                        onClick={login}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 dark:text-brand-dark text-white rounded-lg transition-colors duration-150"
                      >
                        Connect
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Coming soon placeholder */}
              <div className="p-4 border border-dashed border-gray-200 dark:border-white/8 rounded-xl opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-white/6 rounded-lg flex items-center justify-center shrink-0">
                    <XMarkIcon className="w-4 h-4 text-gray-400 dark:text-white/30" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-white/40">More platforms</p>
                    <p className="text-xs text-gray-400 dark:text-white/25">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
