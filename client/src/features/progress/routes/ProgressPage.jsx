import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../authentication/state/authSlice";
import DetailedReportModal from "../components/DetailedReportModal";
import RestrictedAccess from "../../../components/ui/RestrictedAccess";
import OverallStats from "../components/OverallStats";
import DeckProgressList from "../components/DeckProgressList";
import ProgressPageHeader from "../components/ProgressPageHeader";

function ProgressPage() {
  const user = useSelector(selectCurrentUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const handleViewReport = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  if (!user) {
    return (
      <RestrictedAccess description="You need to be logged in to view your progress and track your learning journey." />
    );
  }

  return (
    <div className="min-h-screen bg-brand-light dark:bg-[#0f0d1a] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProgressPageHeader user={user} />
        <OverallStats user={user} />
        <DeckProgressList user={user} onViewReport={handleViewReport} />
      </div>

      {selectedCard && (
        <DetailedReportModal
          isOpen={isModalOpen}
          cardId={selectedCard.card_id}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default ProgressPage;
