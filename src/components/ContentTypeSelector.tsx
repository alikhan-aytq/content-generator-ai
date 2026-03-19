import { FileText, ShoppingBag, Megaphone, MessageSquare } from "lucide-react";

const contentTypes = [
  { id: "social", label: "Social Media", icon: MessageSquare },
  { id: "ads", label: "Advertising", icon: Megaphone },
  { id: "article", label: "Articles", icon: FileText },
  { id: "product", label: "Descriptions", icon: ShoppingBag },
] as const;

export type ContentType = (typeof contentTypes)[number]["id"];

interface Props {
  selected: ContentType;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2">
      {contentTypes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}
