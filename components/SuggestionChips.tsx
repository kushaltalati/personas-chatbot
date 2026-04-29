"use client";

type Props = {
  chips: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
};

export default function SuggestionChips({ chips, onPick, disabled }: Props) {
  return (
    <div className="suggestions">
      {chips.map((c) => (
        <button key={c} className="chip" disabled={disabled} onClick={() => onPick(c)}>
          {c}
        </button>
      ))}
    </div>
  );
}
