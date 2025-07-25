import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { hasPermission } from "@/utils/permissions";
import { InviteCollaboratorDialog } from "../integrations/invite-collaborator-dialog";
import { CollaboratorsList } from "./collaborators-list";
import { PendingInvitationsList } from "./pending-invitations-list";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SettingsSection } from "@/styles/projects/project-settings.styles";

export const CollaboratorsSection = () => {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: roleData } = trpc.projectMembers.getUserProjectRole.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const userRole = roleData?.role ?? "viewer";
  const canInvite = hasPermission(userRole, "inviteMember");
  const canViewInvitations = hasPermission(userRole, "viewInvitations");

  const { data: membersData, isLoading: membersLoading } =
    trpc.projectMembers.getMembers.useQuery(
      { projectId },
      { enabled: !!projectId }
    );

  const { data: invitationsData, isLoading: invitationsLoading } =
    trpc.projectMembers.getInvitations.useQuery(
      { projectId },
      { enabled: !!projectId && canViewInvitations }
    );

  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SettingsSection>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        {canViewInvitations ? (
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Manage Collaborators
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invite and manage roles for team members.
            </Typography>
          </Box>
        ) : (
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Collaborators
          </Typography>
        )}

        {canInvite && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ minWidth: 180 }}
          >
            Invite Collaborator
          </Button>
        )}
      </Box>

      <CollaboratorsList
        members={membersData || []}
        loading={membersLoading}
        userRole={userRole}
      />

      {canViewInvitations && (
        <PendingInvitationsList
          invitations={invitationsData || []}
          loading={invitationsLoading}
        />
      )}

      <InviteCollaboratorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </SettingsSection>
  );
};
