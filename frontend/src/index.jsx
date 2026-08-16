import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./redux/store";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "./hooks/useContext";
import { currentBrandConfig } from "./config/brandConfig";

const brand = import.meta.env.VITE_BRAND;
if (brand === 'UB') {
  const iconLink = document.querySelector("link[rel~='icon']");
  if (iconLink) iconLink.href = "/uongbi/favicon.ico";
  const appleIconLink = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIconLink) appleIconLink.href = "/uongbi/logo192.ico";
} else if (brand === 'CP') {
  const iconLink = document.querySelector("link[rel~='icon']");
  if (iconLink) iconLink.href = "/campha/favicon.ico";
  const appleIconLink = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIconLink) appleIconLink.href = "/campha/logo192.png";
} else if (brand === 'CS') {
  const iconLink = document.querySelector("link[rel~='icon']");
  if (iconLink) iconLink.href = "/caoson/favicon.ico";
  const appleIconLink = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIconLink) appleIconLink.href = "/caoson/logo192.png";
}
document.title = currentBrandConfig.title;

const root = ReactDOM.createRoot(document.getElementById("root"));

const queryClient = new QueryClient();
root.render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <ConfigProvider>
            <CssBaseline />
            <App />
          </ConfigProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </QueryClientProvider>,
);
