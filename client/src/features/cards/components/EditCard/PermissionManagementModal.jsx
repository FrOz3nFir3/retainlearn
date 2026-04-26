import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useGetReviewersQuery,
  useAddReviewersMutation,
  useRemoveReviewerMutation,
  useSearchUsersQuery,
} from "../../../../api/apiSlice";
import { selectCurrentCard } from "../../state/cardSlice";
import { selectCurrentUser } from "../../../authentication/state/authSlice";
import Modal from "../../../../components/ui/Modal";
import {
  UserGroupIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";

const PermissionManagementModal = ({ isOpen, onClose }) => {
  const card = useSelector(selectCurrentCard);
  const currentUser = useSelector(selectCurrentUser);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showConfirmRemove, setShowConfirmRemove] = useState(null);
  const errorRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
      setAllSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: reviewersData,
    isLoading: reviewersLoading,
    error: reviewersError,
  } = useGetReviewersQuery(card?._id, {
    skip: !card?._id || !isOpen,
  });

  const reviewers = Array.isArray(reviewersData)
    ? reviewersData
    : Array.isArray(reviewersData?.data)
    ? reviewersData.data
    : Array.isArray(reviewersData?.reviewers)
    ? reviewersData.reviewers
    : [];

  const {
    data: searchData,
    isLoading: searchLoading,
    error: searchError,
    isFetching: searchFetching,
  } = useSearchUsersQuery(
    { search: debouncedSearchTerm, id: card?._id, page },
    {
      skip: !debouncedSearchTerm || debouncedSearchTerm.length < 2 || !isOpen,
    }
  );

  const [allSearchResults, setAllSearchResults] = useState([]);

  useEffect(() => {
    if (searchData && !searchError) {
      const newResults = Array.isArray(searchData)
        ? searchData
        : Array.isArray(searchData?.data)
        ? searchData.data
        : Array.isArray(searchData?.users)
        ? searchData.users
        : [];
      if (page === 1) {
        setAllSearchResults(newResults);
      } else {
        setAllSearchResults((prev) => {
          const existingUsernames = new Set(prev.map((user) => user.username));
          const uniqueNewResults = newResults.filter(
            (user) => !existingUsernames.has(user.username)
          );
          return [...prev, ...uniqueNewResults];
        });
      }
    }
  }, [searchData, searchError, page]);

  const searchResults = allSearchResults;

  const [addReviewers, { isLoading: addingReviewers, error: addError }] =
    useAddReviewersMutation();

  const [removeReviewer, { isLoading: removingReviewer, error: removeError }] =
    useRemoveReviewerMutation();

  useEffect(() => {
    if ((addError || removeError) && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [addError, removeError]);

  const handleAddReviewers = async () => {
    if (selectedUsers.length === 0) return;
    const usernames = selectedUsers.map((user) => user.username);
    try {
      await addReviewers({ cardId: card._id, usernames }).unwrap();
      setSelectedUsers([]);
      setSearchTerm("");
    } catch (error) {}
  };

  const handleRemoveReviewer = async (username) => {
    try {
      await removeReviewer({ cardId: card._id, username }).unwrap();
      setShowConfirmRemove(null);
    } catch (error) {}
  };

  const handleUserSelect = (user) => {
    if (isUserReviewer(user.username)) return;
    if (isUserSelected(user.username)) return;
    setSelectedUsers([...selectedUsers, user]);
  };

  const handleRemoveSelected = (username) => {
    setSelectedUsers(selectedUsers.filter((user) => user.username !== username));
  };

  const filteredSearchResults = Array.isArray(searchResults) ? searchResults : [];

  const isUserReviewer = (username) =>
    Array.isArray(reviewers) &&
    reviewers.some((reviewer) => reviewer.username === username);

  const isUserSelected = (username) =>
    selectedUsers.some((selected) => selected.username === username);

  const isAuthor = (username) => {
    const autorUsername =
      typeof card?.author === "object" ? card?.author?.username : card?.author;
    return autorUsername === username;
  };

  const hasMore = searchData?.hasMore ?? false;

  const avatarInitial = (user) =>
    (user.name || user.username || "U").charAt(0).toUpperCase();

  return (
    <Modal maxWidth="4xl" isOpen={isOpen} onClose={onClose}>
      <div className="bg-gray-50 dark:bg-[#14112a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-surface dark:bg-white/8 rounded-xl">
            <UserGroupIcon className="h-6 w-6 text-brand-primary dark:text-brand-accent/70" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent mb-0.5">
              Permissions
            </p>
            <h2 className="font-heading text-2xl text-gray-900 dark:text-white leading-tight">
              Manage Reviewers
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 transition-colors duration-150"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-white/40" />
        </button>
      </div>

      {/* Error Display */}
      <div ref={errorRef}>
        {(addError || removeError) && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  {addError?.data?.error ||
                    removeError?.data?.error ||
                    "An error occurred while managing reviewers."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {reviewersError?.status === 403 || reviewersError?.status === 401 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-8 text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-2xl mb-4">
            <LockClosedIcon className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="font-heading text-lg text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h3>
          <p className="text-sm text-gray-500 dark:text-white/40 mb-4">
            Only the author and existing reviewers can manage permissions.
          </p>
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          {/* Search Section */}
          <div className="bg-white dark:bg-white/3 rounded-2xl border border-gray-200 dark:border-white/8 p-5 mb-4">
            <div className="flex items-center gap-2.5 mb-4">
              <MagnifyingGlassIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent/70" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/80">
                Add New Reviewers
              </h3>
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, or email..."
                className="block w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 dark:focus:ring-brand-accent/30 text-sm"
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-white/40 mb-2">
                  Selected ({selectedUsers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.username}
                      className="flex items-center gap-1.5 bg-brand-surface dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent border border-brand-primary/20 dark:border-brand-accent/20 px-3 py-1 rounded-lg text-xs font-medium"
                    >
                      <UserCircleIcon className="h-3.5 w-3.5" />
                      <span>{user.name} (@{user.username})</span>
                      <button
                        onClick={() => handleRemoveSelected(user.username)}
                        className="cursor-pointer hover:opacity-70 ml-0.5"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchTerm.length >= 2 && (
              <div className="mb-4">
                {searchLoading ||
                (debouncedSearchTerm !== searchTerm && searchTerm.length >= 2) ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/3 rounded-xl"
                      >
                        <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded-full w-3/4" />
                          <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredSearchResults.length > 0 ? (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {filteredSearchResults.map((user) => {
                      const alreadyReviewer = isUserReviewer(user.username);
                      const alreadySelected = isUserSelected(user.username);
                      return (
                        <div
                          key={user.username}
                          onClick={() => handleUserSelect(user)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 border ${
                            alreadyReviewer || alreadySelected
                              ? "bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/6 cursor-not-allowed opacity-60"
                              : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/6 hover:border-brand-primary/30 dark:hover:border-brand-accent/30 cursor-pointer"
                          }`}
                        >
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${
                              alreadyReviewer
                                ? "bg-emerald-500"
                                : "bg-brand-primary dark:bg-brand-accent dark:text-brand-dark"
                            }`}
                          >
                            {avatarInitial(user)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.name || user.username || "Unknown User"}
                              </p>
                              {alreadyReviewer && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full shrink-0">
                                  <ShieldCheckIcon className="h-3 w-3" />
                                  Reviewer
                                </span>
                              )}
                              {alreadySelected && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-brand-surface dark:bg-brand-accent/10 text-brand-primary dark:text-brand-accent text-xs font-medium rounded-full shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-white/30 truncate">
                              @{user.username}
                            </p>
                          </div>
                          {!alreadyReviewer && !alreadySelected && (
                            <PlusIcon className="h-4 w-4 text-brand-primary dark:text-brand-accent shrink-0" />
                          )}
                        </div>
                      );
                    })}
                    {hasMore && (
                      <div className="flex flex-col items-center pt-4 border-t border-gray-100 dark:border-white/6 mt-2">
                        <button
                          onClick={() => setPage((prev) => prev + 1)}
                          disabled={searchFetching}
                          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {searchFetching ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <PlusIcon className="h-4 w-4" />
                          )}
                          {searchFetching ? "Loading..." : "Load More"}
                        </button>
                        <p className="text-xs text-gray-400 dark:text-white/30 mt-2">
                          Showing {allSearchResults.length} users
                        </p>
                      </div>
                    )}
                  </div>
                ) : debouncedSearchTerm.length >= 2 ? (
                  <div className="text-center py-6">
                    <UserCircleIcon className="h-10 w-10 text-gray-300 dark:text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-white/40">No users found</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Add Button */}
            {selectedUsers.length > 0 && (
              <button
                onClick={handleAddReviewers}
                disabled={addingReviewers}
                className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white dark:text-brand-dark bg-brand-primary hover:bg-indigo-700 dark:bg-brand-accent dark:hover:bg-amber-400 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingReviewers ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
                {addingReviewers
                  ? "Adding..."
                  : `Add ${selectedUsers.length} Reviewer${selectedUsers.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>

          {/* Current Reviewers */}
          <div className="bg-white dark:bg-white/3 rounded-2xl border border-gray-200 dark:border-white/8 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/80">
                Current Reviewers ({Array.isArray(reviewers) ? reviewers.length : 0})
              </h3>
            </div>

            {reviewersLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-400 dark:text-white/30">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Loading reviewers...
              </div>
            ) : reviewersError ? (
              <div className="text-center py-6">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-500 dark:text-red-400">Failed to load reviewers</p>
              </div>
            ) : Array.isArray(reviewers) && reviewers.length > 0 ? (
              <div className="space-y-2">
                {reviewers.map((reviewer) => (
                  <div
                    key={reviewer.username}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/3 rounded-xl border border-gray-100 dark:border-white/6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {avatarInitial(reviewer)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {reviewer.name}
                          </p>
                          {isAuthor(reviewer.username) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                              <ShieldCheckIcon className="h-3 w-3" />
                              Author
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-white/30">
                          @{reviewer.username}
                        </p>
                      </div>
                    </div>
                    {!isAuthor(reviewer.username) &&
                      reviewer.username !== currentUser?.username && (
                        <button
                          onClick={() => setShowConfirmRemove(reviewer)}
                          disabled={removingReviewer}
                          className="cursor-pointer p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <UserGroupIcon className="h-10 w-10 text-gray-300 dark:text-white/20 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-white/30">No reviewers yet</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Remove Confirmation */}
      {showConfirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#14112a] rounded-2xl p-6 max-w-md mx-4 shadow-xl border border-gray-200 dark:border-white/8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Remove Reviewer
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-6">
              Remove <strong className="text-gray-800 dark:text-white/80">{showConfirmRemove.name}</strong> from reviewers? They'll no longer be able to contribute to this set.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmRemove(null)}
                disabled={removingReviewer}
                className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveReviewer(showConfirmRemove.username)}
                disabled={removingReviewer}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingReviewer ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
                {removingReviewer ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 mt-4 flex justify-end border-t border-gray-100 dark:border-white/6">
        <button
          onClick={onClose}
          className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-white/60 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
        >
          Done
        </button>
      </div>
      </div>
    </Modal>
  );
};

export default PermissionManagementModal;
