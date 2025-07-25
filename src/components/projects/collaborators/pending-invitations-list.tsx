import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Skeleton from "@mui/material/Skeleton";
import Chip from "@mui/material/Chip";
import { Database } from "@/lib/types/database.types";
import { CollaboratorsListTableContainer } from "@/styles/projects/collaborators.styles";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { hasPermission } from "@/utils/permissions";

export const PendingInvitationsList = ({
  invitations,
  loading,
}: {
  invitations: {
    created_at: string | null;
    expires_at: string;
    id: string;
    invitee_email: string;
    invitee_id: string | null;
    inviter_id: string;
    project_id: string;
    role: Database["public"]["Enums"]["user_role"];
    status: Database["public"]["Enums"]["invitation_status"];
    token: string;
    updated_at: string | null;
  }[];
  loading: boolean;
}) => {
  const params = useParams();
  const projectId = params.projectId as string;
  const utils = trpc.useUtils();
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [selectedInvite, setSelectedInvite] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const { data: role } = trpc.projectMembers.getUserProjectRole.useQuery({
    projectId,
  });

  const userRole = role?.role ?? "viewer";
  const canCancel = hasPermission(userRole, "cancelInvitation");

  const cancelMutation = trpc.projectMembers.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation canceled");

      utils.projectMembers.getInvitations.invalidate({ projectId });

      setCancelingId(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setCancelingId(null);
    },
  });

  const handleCancelInvitation = async () => {
    if (!selectedInvite) {
      return;
    }

    setCancelingId(selectedInvite.id);
    setConfirmOpen(false);

    await cancelMutation.mutateAsync({
      invitationId: selectedInvite.id,
      projectId,
    });

    setSelectedInvite(null);
  };

  if (!loading && (!invitations || invitations.length === 0)) return null;

  return (
    <CollaboratorsListTableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            {canCancel && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: 1 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={60} />
                  </TableCell>
                  {canCancel && (
                    <TableCell align="right">
                      <Skeleton width={60} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            : invitations.map((invite) => {
                const isCanceling = cancelingId === invite.id;
                const isExpired = new Date(invite.expires_at) < new Date();
                // Determine status for display
                let displayStatus = invite.status;

                if (invite.status === "pending" && isExpired) {
                  displayStatus = "expired";
                }

                return (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.invitee_email}</TableCell>
                    <TableCell>
                      {invite.role.charAt(0).toUpperCase() +
                        invite.role.slice(1)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          displayStatus.charAt(0).toUpperCase() +
                          displayStatus.slice(1)
                        }
                        color={
                          displayStatus === "pending"
                            ? "warning"
                            : displayStatus === "accepted"
                            ? "success"
                            : displayStatus === "rejected"
                            ? "default"
                            : displayStatus === "expired"
                            ? "default"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    {canCancel && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label="cancel"
                          color="error"
                          disabled={
                            isCanceling ||
                            displayStatus !== "pending" ||
                            isExpired
                          }
                          onClick={() => {
                            setSelectedInvite({
                              id: invite.id,
                              email: invite.invitee_email,
                            });
                            setConfirmOpen(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Cancel Invitation</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel the invitation to{" "}
          <b>{selectedInvite?.email}</b>?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={cancelMutation.isPending}
          >
            No
          </Button>
          <Button
            onClick={handleCancelInvitation}
            color="error"
            variant="contained"
            disabled={cancelMutation.isPending}
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </CollaboratorsListTableContainer>
  );
};
