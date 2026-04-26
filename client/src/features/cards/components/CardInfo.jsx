import { CardField } from "./CardField";
import CardMetaInfo from "./CardMetaInfo";
import FieldCard from "./FieldCard";
import {
  TagIcon,
  FolderIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  HashtagIcon,
} from "@heroicons/react/24/solid";

const CardInfo = ({ card }) => {
  const {
    _id,
    "main-topic": mainTopic,
    "sub-topic": subTopic,
    description = "",
    category,
  } = card;

  return (
    <div className="bg-white dark:bg-[#14112a] border border-gray-200 dark:border-white/8 rounded-2xl p-5 sm:p-6">
      <div className="mb-5 pb-4 border-b border-gray-100 dark:border-white/6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent mb-1">
          About this card
        </p>
        <h2 className="font-heading text-lg text-gray-900 dark:text-white leading-tight">Card info</h2>
        <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">Details and metadata</p>
      </div>

      <div className="space-y-5">
        <FieldCard icon={HashtagIcon} title="Main topic">
          <CardField _id={_id} text="main-topic" value={mainTopic} />
        </FieldCard>

        <FieldCard icon={TagIcon} title="Sub topic">
          <CardField _id={_id} text="sub-topic" value={subTopic} />
        </FieldCard>

        <FieldCard icon={FolderIcon} title="Category">
          <CardField _id={_id} text="category" value={category} />
        </FieldCard>

        <FieldCard icon={DocumentTextIcon} title="Description">
          <CardField _id={_id} text="description" value={description} />
        </FieldCard>

        <FieldCard icon={InformationCircleIcon} title="Metadata">
          <CardMetaInfo card={card} />
        </FieldCard>
      </div>
    </div>
  );
};

export default CardInfo;
