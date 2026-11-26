// The editor's calls (P2-09), on today's editing endpoints until the editing API replaces them (P1-11):
// - the set itself comes from GET /api/study-sets/:id (the classroom's call), in the new names;
// - a save is PATCH /api/card, one change at a time, in the old names (`_id` the set, `cardId` a flashcard, `quizId`
//   a question). From the set's reviewers it applies at once; from anyone else it waits in the review queue, and the
//   answer says which (`reviewQueue`);
// - the review queue, the reviewers, the people search and the history are under /api/card/:id.
// A save or a decision on a suggestion marks the set, its queue and its history out of date, and the subject pages,
// campus and report card that count its flashcards and questions.
import { classroomApi } from "#features/classroom/classroomApi.ts";

export type Person = { name: string; username: string };

// A change as the review queue keeps it: a whole suggestion, or one of the changes in it. Display texts are plain
// text, cut short; values are HTML, or a list of ids for a new order.
export type SuggestedChange = {
  changeType: "edit" | "addition" | "deletion";
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  oldDisplayText?: string;
  newDisplayText?: string;
  targetId?: string | null;
};
export type Suggestion = SuggestedChange & {
  _id: string;
  submittedBy: Partial<Person>;
  submittedAt: string;
  expiresAt: string;
  metadata?: { flashcardQuestion?: string; quizQuestion?: string; individualChanges?: SuggestedChange[] };
};

export type HistoryEntry = {
  _id: string;
  eventType: "created" | "updated" | "deleted";
  timestamp: string;
  summary: string;
  changes?: { field: string; preview?: string }[];
  user: Partial<Person>; // empty for a deleted account
};
type HistoryPage = { logs: HistoryEntry[]; hasMore: boolean };

// One save, in today's names. Each is a single change: details, a flashcard, a question, or a new order.
export type SetChange =
  | { "main-topic"?: string; "sub-topic"?: string; category?: string; description?: string }
  | { question: string; answer: string }
  | { cardId: string; question?: string; answer?: string }
  | { cardId: string; deleteFlashcard: true }
  | { reorderFlashcards: string[] }
  | { quizQuestion: string; quizAnswer: string; options: string[]; cardId: string | null }
  | { quizId: string; quizQuestion?: string; quizAnswer?: string; options?: string[]; cardId?: string | null }
  | { quizId: string; deleteQuiz: true }
  | { reorderQuizzes: string[] };

const CONTENT_TAGS = ["Subjects", "Subject", "Campus", "ReportCard"] as const;

export const editorApi = classroomApi.enhanceEndpoints({ addTagTypes: ["Suggestions", "Reviewers", "History", ...CONTENT_TAGS] }).injectEndpoints({
  endpoints: (build) => ({
    getSuggestions: build.query<Suggestion[], string>({
      query: (setId) => `/card/${setId}?view=review-queue`,
      transformResponse: (set: { reviewQueue?: Suggestion[] } | null) => set?.reviewQueue ?? [],
      providesTags: (_list, _error, setId) => [{ type: "Suggestions", id: setId }],
    }),
    // Only the set's reviewers may see the list: anyone else is refused (403), which is how the editor knows who
    // saves directly and who suggests.
    getReviewers: build.query<Person[], string>({
      query: (setId) => `/card/${setId}/reviewers`,
      transformResponse: (body: { reviewers: Person[] }) => body.reviewers,
      providesTags: (_list, _error, setId) => [{ type: "Reviewers", id: setId }],
    }),
    findPeople: build.query<{ users: Person[]; hasMore: boolean }, { setId: string; search: string }>({
      query: ({ setId, search }) => ({ url: "/users/search", params: { id: setId, search, page: 1 } }),
    }),
    getHistory: build.infiniteQuery<HistoryPage, { setId: string; search: string }, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (last, _pages, page) => (last.hasMore ? page + 1 : undefined),
      },
      query: ({ queryArg, pageParam }) => ({ url: `/card/${queryArg.setId}/logs`, params: { page: pageParam, search: queryArg.search } }),
      providesTags: (_pages, _error, { setId }) => [{ type: "History", id: setId }],
    }),

    saveStudySet: build.mutation<{ suggested: boolean }, { setId: string; change: SetChange }>({
      query: ({ setId, change }) => ({ url: "/card", method: "PATCH", body: { _id: setId, ...change } }),
      transformResponse: (body: { reviewQueue?: boolean }) => ({ suggested: body.reviewQueue === true }),
      invalidatesTags: (_saved, error, { setId }) =>
        error ? [] : [{ type: "StudySet", id: setId }, { type: "Suggestions", id: setId }, { type: "History", id: setId }, ...CONTENT_TAGS],
    }),
    acceptSuggestion: build.mutation<void, { setId: string; suggestionId: string }>({
      query: ({ setId, suggestionId }) => ({ url: `/card/${setId}/review-queue/${suggestionId}/accept`, method: "POST" }),
      invalidatesTags: (_done, error, { setId }) =>
        error ? [] : [{ type: "StudySet", id: setId }, { type: "Suggestions", id: setId }, { type: "History", id: setId }, ...CONTENT_TAGS],
    }),
    rejectSuggestion: build.mutation<void, { setId: string; suggestionId: string }>({
      query: ({ setId, suggestionId }) => ({ url: `/card/${setId}/review-queue/${suggestionId}/reject`, method: "POST" }),
      invalidatesTags: (_done, error, { setId }) => (error ? [] : [{ type: "Suggestions", id: setId }]),
    }),
    addReviewer: build.mutation<void, { setId: string; username: string }>({
      query: ({ setId, username }) => ({ url: `/card/${setId}/reviewers`, method: "POST", body: { usernames: [username] } }),
      invalidatesTags: (_done, error, { setId }) => (error ? [] : [{ type: "Reviewers", id: setId }]),
    }),
    removeReviewer: build.mutation<void, { setId: string; username: string }>({
      query: ({ setId, username }) => ({ url: `/card/${setId}/reviewers/${encodeURIComponent(username)}`, method: "DELETE" }),
      invalidatesTags: (_done, error, { setId }) => (error ? [] : [{ type: "Reviewers", id: setId }]),
    }),
  }),
});

export const {
  useGetSuggestionsQuery,
  useGetReviewersQuery,
  useFindPeopleQuery,
  useGetHistoryInfiniteQuery,
  useSaveStudySetMutation,
  useAcceptSuggestionMutation,
  useRejectSuggestionMutation,
  useAddReviewerMutation,
  useRemoveReviewerMutation,
} = editorApi;
