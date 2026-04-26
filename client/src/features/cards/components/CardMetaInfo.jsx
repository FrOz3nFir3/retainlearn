import {
  UserCircleIcon,
  PencilIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <div className="shrink-0 w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8 flex items-center justify-center">
      <Icon className="h-3.5 w-3.5 text-gray-500 dark:text-white/50" />
    </div>
    <div className="min-w-0 flex-1 pt-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-white/35 mb-0.5">
        {label}
      </p>
      <div className="text-sm text-gray-900 dark:text-white/90 wrap-break-word">
        {children}
      </div>
    </div>
  </div>
);

const UserLink = ({ user }) => {
  if (!user) return null;
  return (
    <Link
      to={`/profile/${user.username}`}
      className="text-brand-primary dark:text-brand-accent hover:underline font-medium"
    >
      @{user.username}
    </Link>
  );
};

const CardMetaInfo = ({ card }) => {
  const { author, createdAt, lastUpdatedBy, updatedAt } = card;

  return (
    <div className="space-y-3">
      {author && (
        <>
          <InfoRow icon={UserCircleIcon} label="Created by">
            <UserLink user={author} />
          </InfoRow>
          <InfoRow icon={CalendarIcon} label="Created on">
            {new Date(createdAt).toLocaleDateString()}
          </InfoRow>
        </>
      )}

      {lastUpdatedBy?.name && (
        <div className="pt-3 mt-3 border-t border-gray-100 dark:border-white/6 space-y-3">
          <InfoRow icon={PencilIcon} label="Updated by">
            <UserLink user={lastUpdatedBy} />
          </InfoRow>
          <InfoRow icon={ClockIcon} label="Updated on">
            {new Date(updatedAt).toLocaleString()}
          </InfoRow>
        </div>
      )}
    </div>
  );
};

export default CardMetaInfo;
