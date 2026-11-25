// The subjects (PLAN 14.10): every subject a page at a time, one subject's study sets, a new study set, and a subject
// put on your campus or taken off. The lists are public and change only when a set is made (or edited), so they're
// kept five minutes after their last use, and a new set marks its subject and the lists out of date. Putting a subject
// on your campus marks the campus and the report card (its count of subjects) out of date.
import type { AddedSubject, NewStudySetBody, Subject, SubjectsPage } from "@retainlearn/core";
import { apiSlice } from "#api/apiSlice.js";

export const subjectsApi = apiSlice.enhanceEndpoints({ addTagTypes: ["Subjects", "Subject", "Campus", "ReportCard"] }).injectEndpoints({
  endpoints: (build) => ({
    getSubjects: build.query<SubjectsPage, { search: string; page: number }>({
      query: ({ search, page }) => ({ url: "/subjects", params: search ? { search, page } : { page } }),
      providesTags: ["Subjects"],
      keepUnusedDataFor: 300,
    }),
    // By the name in the address; tagged with the name as it's kept, which a new set in it gives.
    getSubject: build.query<Subject, string>({
      query: (name) => `/subjects/${encodeURIComponent(name)}`,
      providesTags: (subject, _error, name) => [{ type: "Subject", id: subject?.name ?? name }],
      keepUnusedDataFor: 300,
    }),
    createStudySet: build.mutation<{ _id: string }, NewStudySetBody>({
      query: (body) => ({ url: "/cards", method: "POST", body }),
      invalidatesTags: (_set, error, body) => (error ? [] : ["Subjects", { type: "Subject", id: body.category }]),
    }),
    addSubject: build.mutation<AddedSubject, { name: string; tz: string }>({
      query: ({ name, tz }) => ({ url: "/campus/subjects", method: "POST", params: { tz }, body: { name } }),
      invalidatesTags: (_added, error) => (error ? [] : ["Campus", "ReportCard"]),
    }),
    removeSubject: build.mutation<void, string>({
      query: (name) => ({ url: `/campus/subjects/${encodeURIComponent(name)}`, method: "DELETE" }),
      invalidatesTags: (_removed, error) => (error ? [] : ["Campus", "ReportCard"]),
    }),
  }),
});

export const { useGetSubjectsQuery, useGetSubjectQuery, useCreateStudySetMutation, useAddSubjectMutation, useRemoveSubjectMutation } = subjectsApi;
