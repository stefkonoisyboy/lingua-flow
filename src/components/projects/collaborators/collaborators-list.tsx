import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import { useState } from "react";
import { ProjectMemberWithProfile } from "@/lib/di/interfaces/dal.interfaces";
import {
  CollaboratorsListTableContainer,
  StyledAvatar,
} from "@/styles/projects/collaborators.styles";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission, UserRole } from "@/utils/permissions";
import { EditMemberRoleDialog } from "./edit-member-role-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

export const CollaboratorsList = ({
  members,
  loading,
  userRole,
}: {
  members: ProjectMemberWithProfile[];
  loading: boolean;
  userRole: UserRole;
}) => {
  const { user } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<ProjectMemberWithProfile | null>(null);

  const canEdit = hasPermission(userRole, "updateMemberRole");
  const canDelete = hasPermission(userRole, "removeMember");

  const handleEditClick = (member: ProjectMemberWithProfile) => {
    setSelectedMember(member);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedMember(null);
  };

  const handleRemoveClick = (member: ProjectMemberWithProfile) => {
    setSelectedMember(member);
    setRemoveDialogOpen(true);
  };

  const handleRemoveDialogClose = () => {
    setRemoveDialogOpen(false);
    setSelectedMember(null);
  };

  return (
    <CollaboratorsListTableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            {(canEdit || canDelete) && (
              <TableCell align="right">Actions</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton variant="circular" width={40} height={40} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell align="right">
                      <Skeleton width={60} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            : members.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <StyledAvatar>
                        {member.profiles?.full_name
                          ? member.profiles.full_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                          : member.profiles?.email?.[0]?.toUpperCase() || "?"}
                      </StyledAvatar>
                      <span>{member.profiles?.full_name || "-"}</span>
                    </Box>
                  </TableCell>
                  <TableCell>{member.profiles?.email || "-"}</TableCell>
                  <TableCell>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell align="right">
                      {canEdit && (
                        <IconButton
                          size="small"
                          aria-label="edit"
                          disabled={user?.id === member.user_id}
                          onClick={() => handleEditClick(member)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}

                      {canDelete && (
                        <IconButton
                          size="small"
                          aria-label="delete"
                          color="error"
                          disabled={user?.id === member.user_id}
                          onClick={() => handleRemoveClick(member)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <EditMemberRoleDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        member={selectedMember}
      />

      <RemoveMemberDialog
        open={removeDialogOpen}
        onClose={handleRemoveDialogClose}
        member={selectedMember}
      />
    </CollaboratorsListTableContainer>
  );
};
