"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import {
  CenteredContainer,
  Card,
  LogoRow,
  Footer,
} from "@/styles/accept-invitation/accept-invitation.styles";
import Logo from "@/components/logo";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [result, setResult] = useState<
    "idle" | "accepted" | "declined" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch invitation details
  const { data, isLoading } = trpc.projectMembers.getInvitationByToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const { data: user } = trpc.users.existsByEmail.useQuery(
    { email: data?.invitee_email || "" },
    { enabled: !!data?.invitee_email }
  );

  const userExists = Boolean(user);

  const acceptInvitation = trpc.projectMembers.acceptInvitation.useMutation({
    onSuccess: () => {
      setResult("accepted");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    },
  });

  const rejectInvitation = trpc.projectMembers.rejectInvitation.useMutation({
    onSuccess: () => {
      setResult("declined");
    },
    onError: (err) => {
      setResult("error");
      setErrorMsg(err.message || "Failed to decline invitation.");
    },
  });

  useEffect(() => {
    if (!isLoading && data && data.status === "accepted") {
      setResult("accepted");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } else if (!isLoading && data && data.status === "rejected") {
      setResult("declined");
    } else if (
      !isLoading &&
      data &&
      (data.status === "expired" || new Date(data.expires_at) < new Date())
    ) {
      setResult("error");
      setErrorMsg("This invitation has expired.");
    } else if (!isLoading && !data) {
      setResult("error");
      setErrorMsg("Invalid or missing invitation token.");
    }
  }, [isLoading, data]);

  const handleAccept = async () => {
    setResult("idle");
    setErrorMsg(null);

    try {
      // If not authenticated, redirect to sign up with token
      if (!userExists) {
        router.push(
          `/sign-up?invitationToken=${token}&email=${encodeURIComponent(
            data?.invitee_email || ""
          )}`
        );

        return;
      }

      await acceptInvitation.mutateAsync({
        token: token || "",
        userId: user?.id || "",
      });
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleDecline = async () => {
    setResult("idle");
    setErrorMsg(null);

    try {
      await rejectInvitation.mutateAsync({ token: token || "" });
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // UI states
  let content;

  if (isLoading || acceptInvitation.isPending || rejectInvitation.isPending) {
    content = (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress color="primary" />
        <Typography variant="h6" mt={2}>
          Processing your response...
        </Typography>
      </Box>
    );
  } else if (result === "accepted") {
    content = (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
        <Typography variant="h5" fontWeight={600} mt={2}>
          Invitation Accepted!
        </Typography>
        <Typography color="text.secondary">
          Welcome to the team! Redirecting you to the dashboard...
        </Typography>
      </Box>
    );
  } else if (result === "declined") {
    content = (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CancelIcon color="error" sx={{ fontSize: 56 }} />
        <Typography variant="h5" fontWeight={600} mt={2}>
          Invitation Declined
        </Typography>
        <Typography color="text.secondary">
          You have declined the invitation. This window can now be closed.
        </Typography>
      </Box>
    );
  } else if (result === "error") {
    content = (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CancelIcon color="error" sx={{ fontSize: 56 }} />
        <Typography variant="h5" fontWeight={600} mt={2}>
          {errorMsg || "Something went wrong"}
        </Typography>
      </Box>
    );
  } else if (data) {
    content = (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <MailOutlineIcon color="primary" sx={{ fontSize: 56 }} />
        <Typography variant="h5" fontWeight={600} mt={2}>
          You&apos;re Invited!
        </Typography>
        <Typography color="text.secondary" mb={2}>
          You have been invited to collaborate on the project as a{" "}
          <b>{data.role.charAt(0).toUpperCase() + data.role.slice(1)}</b>.
        </Typography>
        <Box display="flex" gap={2} mt={2}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleDecline}
            disabled={acceptInvitation.isPending || rejectInvitation.isPending}
            startIcon={<CancelIcon />}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAccept}
            disabled={acceptInvitation.isPending || rejectInvitation.isPending}
            startIcon={<CheckCircleIcon />}
          >
            Accept Invitation
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <CenteredContainer>
      <LogoRow>
        <Logo />
      </LogoRow>
      <Card>{content}</Card>
      <Footer>
        © {new Date().getFullYear()} LinguaFlow. All rights reserved.
      </Footer>
    </CenteredContainer>
  );
}
