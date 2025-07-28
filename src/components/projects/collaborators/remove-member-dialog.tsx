import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { hasPermission } from "@/utils/permissions";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
import { ProjectMemberWithProfile } from "@/lib/di/interfaces/dal.interfaces";
import { useAuth } from "@/hooks/use-auth";

interface RemoveMemberDialogProps {
  open: boolean;
  onClose: () => void;
  member: ProjectMemberWithProfile | null;
}

export const RemoveMemberDialog = ({
  open,
  onClose,
  member,
}: RemoveMemberDialogProps) => {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const { data: roleData } = trpc.projectMembers.getUserProjectRole.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const userRole = roleData?.role ?? "viewer";
  const canRemoveMember = hasPermission(userRole, "removeMember");

  const utils = trpc.useUtils();

  const removeMemberMutation = trpc.projectMembers.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed successfully!");

      utils.projectMembers.getMembers.invalidate({ projectId });
      utils.projectMembers.getUserProjectRole.invalidate({ projectId });

      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleRemoveMember = async () => {
    if (!member) {
      return;
    }

    await removeMemberMutation.mutateAsync({
      projectId,
      userId: member.user_id,
    });
  };

  if (!canRemoveMember || !member) {
    return null;
  }

  const isSubmitting = removeMemberMutation.isPending;
  const isRemovingSelf = user?.id === member.user_id;
  const isRemovingOwner = member.role === "owner";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove Member</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ mr: 2 }}>
            {member.profiles?.full_name
              ? member.profiles.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
              : member.profiles?.email?.[0]?.toUpperCase() || "?"}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {member.profiles?.full_name || "Unknown User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {member.profiles?.email || "No email"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
            </Typography>
          </Box>
        </Box>

        {isRemovingSelf && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> You are about to remove yourself from
              this project.
              <br />
              You will lose access to all project features and will need to be
              re-invited to regain access.
            </Typography>
          </Alert>
        )}

        {isRemovingOwner && !isRemovingSelf && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> You are about to remove the project
              owner.
              <br />
              This action will remove the owner&apos;s access to the project.
            </Typography>
          </Alert>
        )}

        <Typography variant="body2" paragraph>
          Are you sure you want to remove{" "}
          <strong>
            {member.profiles?.full_name || member.profiles?.email}
          </strong>{" "}
          from this project?
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          component="ul"
          sx={{ pl: 2 }}
        >
          <li>They will lose access to all project features</li>
          <li>They will no longer be able to view or edit translations</li>
          <li>They will need to be re-invited to regain access</li>
          <li>This action cannot be undone</li>
        </Typography>

        {isRemovingSelf && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> After removing yourself, you will be
              redirected to the dashboard.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleRemoveMember}
          variant="contained"
          color="error"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? "Removing..." : "Remove Member"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
