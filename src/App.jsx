import { startTransition, useEffect, useState } from "react";
import { BranchAssistPage } from "./routes/BranchAssistPage";
import { HomePage } from "./routes/HomePage";

const routeMap = {
  "/": HomePage,
  "/branch-assist": BranchAssistPage
};

function normalizePath(pathname) {
  return routeMap[pathname] ? pathname : "/";
}

function emitRouteChange() {
  window.dispatchEvent(new Event("app:navigate"));
}

export function navigate(url) {
  if (window.location.pathname + window.location.search === url) {
    return;
  }

  window.history.pushState({}, "", url);
  emitRouteChange();
}

function getLocationState() {
  return {
    pathname: normalizePath(window.location.pathname),
    searchParams: new URLSearchParams(window.location.search)
  };
}

export default function App() {
  const [locationState, setLocationState] = useState(getLocationState);

  useEffect(() => {
    function syncPath() {
      startTransition(() => {
        setLocationState(getLocationState());
      });
    }

    window.addEventListener("popstate", syncPath);
    window.addEventListener("app:navigate", syncPath);

    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener("app:navigate", syncPath);
    };
  }, []);

  const Page = routeMap[locationState.pathname];
  const langQuery = locationState.searchParams.get("lang");

  return <Page navigate={navigate} selectedLanguage={langQuery || undefined} />;
}
