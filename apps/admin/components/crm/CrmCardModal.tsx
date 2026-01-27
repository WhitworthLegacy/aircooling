"use client";

import { useState } from "react";
import { X, Phone, Mail, MapPin, FileText, CheckSquare, Square, Save } from "lucide-react";
import { CrmClient, CrmColumn } from "./types";

interface CrmCardModalProps {
  open: boolean;
  client: CrmClient | null;
  columns: CrmColumn[];
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChecklistChange?: (clientId: string, checklists: Record<string, any>) => void;
  onNotesChange?: (clientId: string, notes: string) => void;
  onClientUpdate?: () => void;
  mode?: "crm" | "atelier";
  atelierSubstage?: string;
  showArabic?: boolean;
}

export default function CrmCardModal({
  open,
  client,
  onClose,
  onChecklistChange,
  onNotesChange,
  mode = "crm",
  atelierSubstage,
}: CrmCardModalProps) {
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "checklist" | "notes">(
    mode === "atelier" ? "checklist" : "info"
  );

  if (!open || !client) return null;

  const checklists = client.checklists || {};
  const currentChecklist =
    mode === "atelier" && atelierSubstage
      ? checklists[atelierSubstage]
      : undefined;

  const handleToggleItem = (itemId: string) => {
    if (!currentChecklist || !onChecklistChange) return;

    const updated = {
      ...checklists,
      [atelierSubstage!]: {
        ...currentChecklist,
        items: currentChecklist.items.map((item: { id: string; checked: boolean; label: string }) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      },
    };
    onChecklistChange(client.id, updated);
  };

  const handleSaveNotes = () => {
    if (onNotesChange) {
      onNotesChange(client.id, notes || client.notes);
    }
  };

  const tabs = [
    { id: "info" as const, label: "Info" },
    ...(mode === "atelier"
      ? [{ id: "checklist" as const, label: "Checklist" }]
      : []),
    { id: "notes" as const, label: "Notes" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-lg transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-airBorder">
            <div>
              <h3 className="text-lg font-bold text-airDark">{client.name}</h3>
              <p className="text-sm text-airMuted">{client.stage}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-airMuted hover:text-airDark hover:bg-airSurface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-airBorder">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "text-airPrimary border-b-2 border-airPrimary"
                    : "text-airMuted hover:text-airDark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Info tab */}
            {activeTab === "info" && (
              <div className="space-y-4">
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-airMuted" />
                    <a
                      href={`tel:${client.phone}`}
                      className="text-airPrimary hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-airMuted" />
                    <a
                      href={`mailto:${client.email}`}
                      className="text-airPrimary hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
                {client.zone && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-airMuted" />
                    <span className="text-airDark">{client.zone}</span>
                  </div>
                )}
                {client.systemType && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-airMuted" />
                    <span className="text-airDark">{client.systemType}</span>
                  </div>
                )}
                {client.notes && (
                  <div className="mt-4 p-3 bg-airSurface rounded-xl">
                    <p className="text-sm text-airDark whitespace-pre-wrap">
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Checklist tab (atelier mode) */}
            {activeTab === "checklist" && mode === "atelier" && (
              <div className="space-y-3">
                {currentChecklist ? (
                  <>
                    <h4 className="font-semibold text-airDark">
                      {currentChecklist.title}
                    </h4>
                    <div className="space-y-2">
                      {currentChecklist.items.map((item: { id: string; checked: boolean; label: string }) => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleItem(item.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-airSurface transition text-left"
                        >
                          {item.checked ? (
                            <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-airMuted flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm ${
                              item.checked
                                ? "text-airMuted line-through"
                                : "text-airDark"
                            }`}
                          >
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-airMuted text-center py-8">
                    Pas de checklist pour cette étape.
                  </p>
                )}
              </div>
            )}

            {/* Notes tab */}
            {activeTab === "notes" && (
              <div className="space-y-3">
                <textarea
                  className="w-full h-32 p-3 border border-airBorder rounded-xl text-sm text-airDark resize-none focus:ring-2 focus:ring-airPrimary/30 focus:border-airPrimary outline-none"
                  placeholder="Ajouter une note..."
                  value={notes || client.notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-2 px-4 py-2 bg-airPrimary text-white rounded-xl text-sm font-medium hover:bg-airPrimary/90 transition"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
