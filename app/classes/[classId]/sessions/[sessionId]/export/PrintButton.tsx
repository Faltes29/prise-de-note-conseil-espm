"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded bg-primary px-3 py-1.5 text-sm font-medium text-white"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
