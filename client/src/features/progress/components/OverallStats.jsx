import {
  BookOpenIcon,
  TrophyIcon,
  ChartBarIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import StatCard from "../../../components/ui/StatCard";
import { useGetUserStatsQuery } from "../../../api/apiSlice";

const OverallStatsSkeleton = () => (
  <div className="mb-10">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-6 animate-pulse"
        >
          <div className="w-10 h-10 bg-gray-200 dark:bg-white/8 rounded-xl mb-4" />
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-20 mb-2" />
          <div className="h-8 bg-gray-200 dark:bg-white/8 rounded w-16 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-full" />
        </div>
      ))}
    </div>
  </div>
);

const OverallStats = ({ user }) => {
  const { data: statsData, isLoading } = useGetUserStatsQuery(undefined, {
    skip: !user?.email,
  });

  if (!user) return null;
  if (isLoading) return <OverallStatsSkeleton />;
  if (!statsData) return null;

  const {
    totalDecksStudied,
    totalQuizzesTaken,
    totalCorrect,
    totalIncorrect,
    totalQuizzesFinished,
    overallAccuracy,
    completionRate,
  } = statsData;

  const totalAnswers = totalCorrect + totalIncorrect;

  const stats = [
    {
      name: "Decks studied",
      stat: totalDecksStudied,
      icon: BookOpenIcon,
      description: "Active collections you're working through",
      trend: totalDecksStudied > 3 ? "Great variety" : null,
    },
    {
      name: "Accuracy",
      stat: `${overallAccuracy}%`,
      icon: TrophyIcon,
      description: `${totalCorrect} correct out of ${totalAnswers} attempts`,
      trend: overallAccuracy > 75 ? "Excellent" : overallAccuracy > 50 ? "Good progress" : null,
    },
    {
      name: "Quiz sessions",
      stat: totalQuizzesTaken,
      icon: PlayCircleIcon,
      description: "Total practice sessions started",
      trend: totalQuizzesTaken > 10 ? "Very active" : totalQuizzesTaken > 5 ? "Good practice" : null,
    },
    {
      name: "Completion rate",
      stat: `${completionRate}%`,
      icon: ChartBarIcon,
      description: `${totalQuizzesFinished} of ${totalQuizzesTaken} sessions finished`,
      trend: completionRate > 80 ? "Consistent" : completionRate > 60 ? "Good follow-through" : null,
    },
  ];

  return (
    <div className="mb-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.name} {...item} />
        ))}
      </div>

      {/* Summary strip */}
      <div className="mt-4 flex flex-wrap items-center gap-6 px-6 py-4 bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl">
        <p className="text-sm text-gray-500 dark:text-white/45 grow">
          You've studied{" "}
          <span className="font-semibold text-gray-900 dark:text-white">{totalDecksStudied} deck{totalDecksStudied !== 1 ? "s" : ""}</span>{" "}
          with an average accuracy of{" "}
          <span className="font-semibold text-brand-accent">{overallAccuracy}%</span>.
          {" "}Keep going!
        </p>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <p className="font-heading text-xl text-gray-900 dark:text-white">{totalQuizzesTaken}</p>
            <p className="text-xs text-gray-400 dark:text-white/30">Quizzes</p>
          </div>
          <div className="text-center">
            <p className="font-heading text-xl text-brand-accent">{totalCorrect}</p>
            <p className="text-xs text-gray-400 dark:text-white/30">Correct</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallStats;
