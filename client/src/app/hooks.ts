// The store's dispatch, typed, for new code: it accepts RTK Query's thunks (endpoint.initiate()). RTK's pattern
// (useDispatch.withTypes), with the type read from the store itself.
import { useDispatch } from "react-redux";
import type store from "#app/configureStore.js";

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
