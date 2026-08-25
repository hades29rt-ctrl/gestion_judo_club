import { AlertTriangle } from "lucide-react";

interface Props {
  titre: string;
  message: string;
  libelleConfirmation?: string;
  enCours?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationSuppressionModal({
  titre,
  message,
  libelleConfirmation = "Supprimer",
  enCours,
  onConfirm,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-base">{titre}</h2>
            <p className="text-sm text-muted mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-ink_text"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={enCours}
            className="px-4 py-2 bg-danger text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {enCours ? "Traitement..." : libelleConfirmation}
          </button>
        </div>
      </div>
    </div>
  );
}
