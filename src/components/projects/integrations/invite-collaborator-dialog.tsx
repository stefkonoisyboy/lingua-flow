import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { hasPermission } from "@/utils/permissions";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "translator", label: "Translator" },
  { value: "viewer", label: "Viewer" },
];

export const InviteCollaboratorDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: roleData } = trpc.projectMembers.getUserProjectRole.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const userRole = roleData?.role ?? "viewer";
  const canInvite = hasPermission(userRole, "inviteMember");

  const utils = trpc.useUtils();

  const inviteMutation = trpc.projectMembers.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent!");

      utils.projectMembers.getMembers.invalidate({ projectId });
      utils.projectMembers.getInvitations.invalidate({ projectId });

      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const formik = useFormik({
    initialValues: { email: "", role: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Required"),
      role: Yup.string()
        .oneOf(["owner", "translator", "viewer"])
        .required("Required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      await inviteMutation.mutateAsync({
        projectId,
        email: values.email,
        role: values.role as "owner" | "translator" | "viewer",
      });

      resetForm();
    },
  });

  if (!canInvite) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Invite a new member</DialogTitle>
      <DialogContent>
        <div style={{ marginBottom: 16 }}>
          Enter the email address of the person you want to invite and assign
          them a role.
        </div>

        <form onSubmit={formik.handleSubmit} id="invite-collaborator-form">
          <TextField
            fullWidth
            margin="normal"
            id="email"
            name="email"
            label="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            autoFocus
          />

          <TextField
            select
            fullWidth
            margin="normal"
            id="role"
            name="role"
            label="Role"
            value={formik.values.role}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.role && Boolean(formik.errors.role)}
            helperText={formik.touched.role && formik.errors.role}
          >
            {ROLES.filter((role) => role.value !== "owner").map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </form>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={formik.isSubmitting}>
          Cancel
        </Button>

        <Button
          type="submit"
          form="invite-collaborator-form"
          variant="contained"
          color="primary"
          disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}
          startIcon={
            formik.isSubmitting ? <CircularProgress size={18} /> : null
          }
        >
          Send Invitation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
