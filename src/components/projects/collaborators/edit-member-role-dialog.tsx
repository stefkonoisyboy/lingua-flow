import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { hasPermission } from "@/utils/permissions";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
import { ProjectMemberWithProfile } from "@/lib/di/interfaces/dal.interfaces";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  EditMemberRoleAvatar,
  OwnershipTransferWarning,
  ConfirmOwnershipWarning,
  ConfirmOwnershipWarningContent,
  ActionCannotBeUndone,
} from "@/styles/projects/collaborators.styles";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "translator", label: "Translator" },
  { value: "viewer", label: "Viewer" },
];

interface EditMemberRoleDialogProps {
  open: boolean;
  onClose: () => void;
  member: ProjectMemberWithProfile | null;
}

export const EditMemberRoleDialog = ({
  open,
  onClose,
  member,
}: EditMemberRoleDialogProps) => {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();
  const [showOwnershipWarning, setShowOwnershipWarning] = useState(false);

  const { data: roleData } = trpc.projectMembers.getUserProjectRole.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const userRole = roleData?.role ?? "viewer";
  const canEditRole = hasPermission(userRole, "updateMemberRole");

  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.projectMembers.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Member role updated successfully!");

      utils.projectMembers.getMembers.invalidate({ projectId });
      utils.projectMembers.getUserProjectRole.invalidate({ projectId });

      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const formik = useFormik({
    initialValues: {
      role: member?.role || "viewer",
    },
    validationSchema: Yup.object({
      role: Yup.string()
        .oneOf(["owner", "translator", "viewer"])
        .required("Required"),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!member) {
        return;
      }

      // Check if this is an ownership transfer
      const isOwnershipTransfer =
        member.role !== "owner" &&
        values.role === "owner" &&
        user?.id !== member.user_id;

      if (isOwnershipTransfer) {
        setShowOwnershipWarning(true);
        return;
      }

      await updateRoleMutation.mutateAsync({
        projectId,
        userId: member.user_id,
        newRole: values.role as "owner" | "translator" | "viewer",
      });
    },
  });

  const handleOwnershipTransferConfirm = async () => {
    if (!member) {
      return;
    }

    await updateRoleMutation.mutateAsync({
      projectId,
      userId: member.user_id,
      newRole: "owner",
    });

    setShowOwnershipWarning(false);
  };

  const handleOwnershipTransferCancel = () => {
    setShowOwnershipWarning(false);
    formik.setFieldValue("role", member?.role || "viewer");
  };

  if (!canEditRole || !member) {
    return null;
  }

  const isSubmitting = updateRoleMutation.isPending;
  const isOwnershipTransfer =
    member.role !== "owner" &&
    formik.values.role === "owner" &&
    user?.id !== member.user_id;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Member Role</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Box display="flex" alignItems="center" mb={3}>
              <EditMemberRoleAvatar>
                {member.profiles?.full_name
                  ? member.profiles.full_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                  : member.profiles?.email?.[0]?.toUpperCase() || "?"}
              </EditMemberRoleAvatar>
              <Box>
                <Typography variant="h6">
                  {member.profiles?.full_name || "Unknown User"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {member.profiles?.email || "No email"}
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              select
              label="Role"
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.role && Boolean(formik.errors.role)}
              helperText={formik.touched.role && formik.errors.role}
              disabled={isSubmitting}
            >
              {ROLES.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </TextField>

            {isOwnershipTransfer && (
              <OwnershipTransferWarning severity="warning">
                <Typography variant="body2">
                  <strong>Ownership Transfer Warning:</strong>
                  <br />
                  You are about to transfer project ownership to this member.
                  You will be automatically demoted to Translator role.
                  <br />
                  <strong>This action cannot be undone.</strong>
                </Typography>
              </OwnershipTransferWarning>
            )}

            <Typography variant="body2" color="text.secondary" mt={2}>
              <strong>Role Permissions:</strong>
              <br />
              <strong>Owner:</strong> Full access to all project features
              <br />
              <strong>Translator:</strong> Can edit translations and add
              comments
              <br />
              <strong>Viewer:</strong> Can view content and add comments
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!formik.isValid || isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={16} /> : undefined
              }
            >
              {isSubmitting ? "Updating..." : "Update Role"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Ownership Transfer Confirmation Dialog */}
      <Dialog
        open={showOwnershipWarning}
        onClose={handleOwnershipTransferCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Ownership Transfer</DialogTitle>
        <DialogContent>
          <ConfirmOwnershipWarning severity="warning">
            <Typography variant="body2">
              <strong>Warning:</strong> You are about to transfer project
              ownership to{" "}
              <strong>
                {member.profiles?.full_name || member.profiles?.email}
              </strong>
              .
            </Typography>
          </ConfirmOwnershipWarning>

          <Typography variant="body2" paragraph>
            This action will:
          </Typography>

          <ConfirmOwnershipWarningContent variant="body2" as="ul">
            <li>
              Make{" "}
              <strong>
                {member.profiles?.full_name || member.profiles?.email}
              </strong>{" "}
              the new project owner
            </li>
            <li>
              Demote you to <strong>Translator</strong> role
            </li>
            <li>Remove your ability to manage project settings and members</li>
            <li>Transfer all owner permissions to the new owner</li>
          </ConfirmOwnershipWarningContent>

          <ActionCannotBeUndone variant="body2" color="error">
            <strong>This action cannot be undone.</strong>
          </ActionCannotBeUndone>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOwnershipTransferCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleOwnershipTransferConfirm}
            variant="contained"
            color="error"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={16} /> : undefined
            }
          >
            {isSubmitting ? "Transferring..." : "Transfer Ownership"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
