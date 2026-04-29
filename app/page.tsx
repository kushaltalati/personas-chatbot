"use client";

import { useState } from "react";
import { personas, personaList, PersonaId } from "@/lib/personas";
import PersonaSwitcher from "@/components/PersonaSwitcher";
import ChatWindow from "@/components/ChatWindow";

const STORAGE_PREFIX = "scaler-chat:";

export default function Home() {
  const [activeId, setActiveId] = useState<PersonaId>("anshuman");
  const [chatLoading, setChatLoading] = useState(false);
  const active = personas[activeId];

  function handleSwitch(id: PersonaId) {
    if (chatLoading || id === activeId) return;
    // Rubric: switching persona resets the conversation. Wipe every persona's
    // saved chat so we don't restore stale history if the user switches back.
    for (const p of personaList) {
      localStorage.removeItem(STORAGE_PREFIX + p.id);
    }
    setActiveId(id);
  }

  return (
    <main className="app">
      <header className="header">
        <h1>Scaler Personas — AI Chatbot</h1>
        <p>Chat with persona-based AI versions of three Scaler personalities.</p>
      </header>

      <PersonaSwitcher
        personas={personaList}
        activeId={activeId}
        onSwitch={handleSwitch}
        disabled={chatLoading}
      />

      <div
        className="active-banner"
        style={{ ["--accent" as string]: active.accentColor }}
      >
        <div className="avatar">{active.avatarInitials}</div>
        <div className="info">
          <span className="name">Now chatting with {active.name}</span>
          <span className="blurb">{active.blurb}</span>
        </div>
      </div>

      <ChatWindow persona={active} onLoadingChange={setChatLoading} />

      <footer className="footer">
        Built for Scaler Academy · Prompt Engineering Assignment 01
      </footer>
    </main>
  );
}
