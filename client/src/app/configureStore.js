import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { apiSlice } from "../api/apiSlice";
import authSlicer from "../features/authentication/state/authSlice";
import cardSlicer from "../features/cards/state/cardSlice";

const reducer = {
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authSlicer.reducer,
  card: cardSlicer.reducer,
};
const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Lets a query ask to be fetched again when the tab comes back into view or the connection returns (the campus does,
// since the day may have turned). Queries that don't ask aren't affected.
setupListeners(store.dispatch);

export default store;
