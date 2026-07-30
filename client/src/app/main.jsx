import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store from "./configureStore";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
// No italic: its real italic is visually identical to the browser's synthetic
// slant for this typeface, so it's not worth shipping the extra file.
import "../styles/main.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
