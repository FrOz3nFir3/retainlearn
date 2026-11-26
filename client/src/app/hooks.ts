// The store's dispatch, typed, for new code: it accepts RTK Query's thunks (endpoint.initiate()). RTK's pattern
// (useDispatch.withTypes), with the type read from the store itself.
import { useDispatch, useSelector } from "react-redux";
import type store from "#app/configureStore.js";

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// Whether someone is signed in (the session the old app keeps in state.auth).
export const useSignedIn = (): boolean => useAppSelector((state) => Boolean((state.auth as { user?: unknown }).user));

// Your username while you're signed in, else null.
export const useMyUsername = (): string | null => useAppSelector((state) => (state.auth as { user?: { username?: string } | null }).user?.username ?? null);
