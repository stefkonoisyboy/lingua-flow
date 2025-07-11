import { FC } from "react";
import {
  DialogTitle,
  DialogContent,
  Typography,
  CircularProgress,
  Box,
  TextField,
  Button,
  Avatar,
} from "@mui/material";
import { Close as CloseIcon, Send as SendIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { trpc } from "@/utils/trpc";
import {
  StyledDialog,
  DialogHeader,
  DialogContentWrapper,
  CommentEntry,
  CommentMeta,
  CommentContent,
  StyledDialogTitle,
  StyledCloseButton,
  CommentForm,
  KeyName,
} from "@/styles/projects/comments.styles";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams } from "next/navigation";

interface CommentsDialogProps {
  open: boolean;
  onClose: () => void;
  translationId: string;
  keyName: string;
  languageName: string;
}

interface CommentFormValues {
  content: string;
}

const validationSchema = Yup.object({
  content: Yup.string().required("Comment cannot be empty"),
});

export const CommentsDialog: FC<CommentsDialogProps> = ({
  open,
  onClose,
  translationId,
  keyName,
  languageName,
}) => {
  const { projectId } = useParams<{ projectId: string }>();
  const utils = trpc.useUtils();

  const { data: comments, isLoading } = trpc.comments.getComments.useQuery(
    { translationId },
    { enabled: open }
  );

  const addCommentMutation = trpc.comments.addComment.useMutation({
    onSuccess: () => {
      utils.comments.getComments.invalidate({ translationId });
      utils.translations.getTranslationKeys.invalidate({
        projectId,
      });
      formik.resetForm();
    },
  });

  const formik = useFormik<CommentFormValues>({
    initialValues: {
      content: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await addCommentMutation.mutateAsync({
          translationId,
          content: values.content,
        });
      } catch (error) {
        console.error("Failed to add comment:", error);
      }
    },
  });

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogHeader>
        <Box>
          <StyledDialogTitle>
            <DialogTitle>
              Comments for: <KeyName>{keyName}</KeyName>
            </DialogTitle>
          </StyledDialogTitle>
          <Typography variant="subtitle1" color="textSecondary">
            Discussing translation in {languageName}.
          </Typography>
        </Box>
        <StyledCloseButton onClick={onClose} size="small">
          <CloseIcon />
        </StyledCloseButton>
      </DialogHeader>

      <DialogContent>
        <DialogContentWrapper>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : comments?.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography color="textSecondary">
                No comments yet. Be the first to start the discussion!
              </Typography>
            </Box>
          ) : (
            comments?.map((comment) => (
              <CommentEntry key={comment.id}>
                <CommentMeta>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      src={comment.user.avatar_url || undefined}
                      alt={
                        comment.user.full_name || comment.user.email || "User"
                      }
                    >
                      {(
                        comment.user.full_name?.[0] ||
                        comment.user.email?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {comment.user.full_name || comment.user.email}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(comment.created_at), "PPpp")}
                      </Typography>
                    </Box>
                  </Box>
                </CommentMeta>
                <CommentContent>
                  <Typography>{comment.content}</Typography>
                </CommentContent>
              </CommentEntry>
            ))
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <CommentForm>
              <TextField
                fullWidth
                multiline
                rows={2}
                name="content"
                placeholder="Add a comment..."
                value={formik.values.content}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.content && Boolean(formik.errors.content)}
                helperText={formik.touched.content && formik.errors.content}
                disabled={addCommentMutation.isPending}
              />
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  type="submit"
                  disabled={
                    addCommentMutation.isPending ||
                    !formik.isValid ||
                    !formik.dirty
                  }
                >
                  Post Comment
                </Button>
              </Box>
            </CommentForm>
          </Box>
        </DialogContentWrapper>
      </DialogContent>
    </StyledDialog>
  );
};
