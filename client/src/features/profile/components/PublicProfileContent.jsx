import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  useGetPublicUserByUsernameQuery,
  useGetCardsByAuthorQuery,
} from "../../../api/apiSlice";
import PublicProfilePageSkeleton from "../../../components/ui/skeletons/PublicProfilePageSkeleton";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import CardGridItem from "../../cards/components/CardGridItem";
import ProfileNotFound from "./ProfileNotFound";
import Pagination from "../../../components/ui/Pagination";
import NoCardsPlaceholder from "./NoCardsPlaceholder";
import CardGridSkeleton from "../../../components/ui/skeletons/CardGridSkeleton";

const CARDS_PER_PAGE = 9;

const PublicProfileContent = () => {
  const { username } = useParams();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: user, isLoading: isLoadingUser } =
    useGetPublicUserByUsernameQuery(username);

  const { data: cardsData, isFetching: isFetchingCards } =
    useGetCardsByAuthorQuery(
      { username: user?.username, page: currentPage },
      { skip: !user?.username }
    );

  if (isLoadingUser) {
    return <PublicProfilePageSkeleton />;
  }

  if (!user) {
    return <ProfileNotFound username={username} />;
  }

  const totalPages = cardsData?.total
    ? Math.ceil(cardsData.total / CARDS_PER_PAGE)
    : 0;

  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a]">
      <div className="container mx-auto 2xl:max-w-7xl p-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-brand-primary dark:bg-brand-accent rounded-3xl flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-white dark:text-brand-dark" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading tracking-tight mb-4 text-gray-900 dark:text-white">
            {user.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            @{user.username}
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-heading text-gray-900 dark:text-white mb-6">
            Cards Created
          </h2>
          {isFetchingCards && !cardsData ? (
            <CardGridSkeleton count={CARDS_PER_PAGE} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cardsData?.cards && cardsData.cards.length > 0 ? (
                  cardsData.cards.map((card) => (
                    <CardGridItem key={card._id} card={card} showCategory />
                  ))
                ) : (
                  <NoCardsPlaceholder username={user.username} />
                )}
              </div>
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                    itemsCount={cardsData.total}
                    itemsPerPage={CARDS_PER_PAGE}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfileContent;
