"use client";

import { Persona, PersonaId } from "@/lib/personas";

type Props = {
  personas: Persona[];
  activeId: PersonaId;
  onSwitch: (id: PersonaId) => void;
  disabled?: boolean;
};

export default function PersonaSwitcher({ personas, activeId, onSwitch, disabled }: Props) {
  return (
    <div className="persona-switcher" role="tablist" aria-label="Choose persona">
      {personas.map((p) => {
        const isActive = p.id === activeId;
        return (
          <button
            key={p.id}
            role="tab"
            aria-selected={isActive}
            className={`persona-tab${isActive ? " active" : ""}`}
            style={{ ["--accent" as string]: p.accentColor }}
            onClick={() => onSwitch(p.id)}
            disabled={disabled && !isActive}
            title={disabled && !isActive ? "Wait for the current reply to finish" : undefined}
          >
            <span className="name">{p.name}</span>
            <span className="title">{p.title}</span>
          </button>
        );
      })}
    </div>
  );
}
