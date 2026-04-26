import { lazy, useEffect, useState } from "react";
import { useParams, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useGetIndividualCardQuery } from "../../../api/apiSlice";
import { initialCard } from "../state/cardSlice";
import CardInfo from "../components/CardInfo";
import CardLogs from "../components/CardLogs";
import Breadcrumbs from "../components/Breadcrumbs";
import IndividualCardPageSkeleton from "../../../components/ui/skeletons/IndividualCardPageSkeleton";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Helmet } from "@dr.pogodin/react-helmet";

const NotFound = lazy(() =>
  import("../../../features/not-found/components/NotFound")
);

function IndividualCardPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("cardEditSidebarCollapsed");
    return saved === "true";
  });

  const isEditRoute = location.pathname.includes("/edit");

  const { data: cardData, isFetching } = useGetIndividualCardQuery({
    id: params.id,
    view: "overview",
  });

  useEffect(() => {
    if (cardData) dispatch(initialCard(cardData));

    const { pathname } = location;
    const view = searchParams.get("view");
    const validViews = ["flashcards", "quizzes", "review-queue"];
    if (pathname.includes("/edit") && !validViews.includes(view)) {
      setSearchParams((prev) => { prev.set("view", "flashcards"); return prev; });
    }
  }, [cardData, dispatch, location, searchParams, setSearchParams]);

  const toggleSidebar = (scrollToId = null) => {
    setIsSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("cardEditSidebarCollapsed", String(newValue));
      if (prev && scrollToId) {
        setTimeout(() => {
          document.getElementById(scrollToId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 350);
      }
      return newValue;
    });
  };

  if (isFetching) return <IndividualCardPageSkeleton isFocusedActivity={false} view="overview" />;
  if (!cardData) return <NotFound />;

  return (
    <div className="bg-brand-light dark:bg-[#0f0d1a] min-h-screen font-sans">
      <Helmet>
        <title>{cardData["main-topic"]} — {cardData["sub-topic"]} — RetainLearn</title>
        <meta name="description" content={cardData.description || `Study flashcard on ${cardData["main-topic"]} — ${cardData["sub-topic"]}.`} />
        <meta property="og:title" content={`${cardData["main-topic"]} — ${cardData["sub-topic"]} — RetainLearn`} />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs card={cardData} cardData={cardData} />

        {/* Mobile: single column */}
        <div className="lg:hidden grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <CardInfo card={cardData} />
            <CardLogs logs={cardData.logs || []} cardId={cardData._id} />
          </div>
          <div>
            <Outlet />
          </div>
        </div>

        {/* Desktop: collapsible sidebar */}
        <div className="hidden lg:block">
          {isEditRoute && isSidebarCollapsed ? (
            <div className="flex gap-6">
              {/* Collapsed sidebar */}
              <div className="w-14 shrink-0">
                <div className="sticky top-6 space-y-3">
                  <button
                    onClick={() => toggleSidebar()}
                    title="Expand sidebar"
                    className="cursor-pointer w-full p-3.5 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-xl hover:border-brand-primary/30 dark:hover:border-brand-accent/30 transition-colors duration-150 group"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 dark:text-white/30 group-hover:text-brand-primary dark:group-hover:text-brand-accent mx-auto transition-colors" />
                  </button>
                  <button
                    onClick={() => toggleSidebar("card-info-section")}
                    title="Card Info"
                    className="cursor-pointer w-full p-3.5 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-xl hover:border-brand-primary/30 dark:hover:border-brand-accent/30 transition-colors duration-150 group"
                  >
                    <InformationCircleIcon className="h-5 w-5 text-gray-400 dark:text-white/30 group-hover:text-brand-primary dark:group-hover:text-brand-accent mx-auto transition-colors" />
                  </button>
                  <button
                    onClick={() => toggleSidebar("card-logs-section")}
                    title="Activity"
                    className="cursor-pointer w-full p-3.5 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-xl hover:border-brand-primary/30 dark:hover:border-brand-accent/30 transition-colors duration-150 group"
                  >
                    <ClockIcon className="h-5 w-5 text-gray-400 dark:text-white/30 group-hover:text-brand-primary dark:group-hover:text-brand-accent mx-auto transition-colors" />
                  </button>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <Outlet />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {/* Sidebar */}
              <div className="col-span-1 space-y-4">
                {isEditRoute && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => toggleSidebar()}
                      title="Collapse sidebar"
                      className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-lg text-xs font-semibold text-gray-500 dark:text-white/50 hover:text-brand-primary dark:hover:text-brand-accent hover:border-brand-primary/30 dark:hover:border-brand-accent/30 transition-colors duration-150"
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                      Collapse
                    </button>
                  </div>
                )}
                <div id="card-info-section">
                  <CardInfo card={cardData} />
                </div>
                <div id="card-logs-section">
                  <CardLogs logs={cardData.logs || []} cardId={cardData._id} />
                </div>
              </div>

              {/* Main content */}
              <div className="col-span-2">
                <Outlet />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IndividualCardPage;
