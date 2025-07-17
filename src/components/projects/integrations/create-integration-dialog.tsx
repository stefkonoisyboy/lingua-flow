import { Dialog, DialogTitle } from "@mui/material";
import { CreateIntegration } from "./create-integration";

interface CreateIntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CreateIntegrationDialog({
  open,
  onClose,
  projectId,
  onSuccess,
  onError,
}: CreateIntegrationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Connect GitHub Repository</DialogTitle>

      <CreateIntegration
        projectId={projectId}
        onClose={onClose}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Dialog>
  );
}
