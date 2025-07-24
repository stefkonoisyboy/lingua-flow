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
  if (!loading && (!invitations || invitations.length === 0)) return null;

  return (
    <CollaboratorsListTableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
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
                  <TableCell align="right">
                    <Skeleton width={60} />
                  </TableCell>
                </TableRow>
              ))
            : invitations.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.invitee_email}</TableCell>
                  <TableCell>
                    {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        invite.status.charAt(0).toUpperCase() +
                        invite.status.slice(1)
                      }
                      color={
                        invite.status === "pending"
                          ? "warning"
                          : invite.status === "accepted"
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" aria-label="cancel" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </CollaboratorsListTableContainer>
  );
};
