"use client";

import { Typography, Chip } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import {
  SyncHistoryList,
  SyncHistoryItem,
  SyncDetails,
} from "@/styles/projects/integrations.styles";
import { trpc } from "@/utils/trpc";
import { Database } from "@/lib/types/database.types";

type SyncDetails =
  Database["public"]["Tables"]["sync_history"]["Row"]["details"] & {
    repository: string;
    branch: string;
    error?: string;
    message?: string;
  };

interface SyncHistoryProps {
  projectId: string;
}

export function SyncHistory({ projectId }: SyncHistoryProps) {
  const { data: syncHistory, isLoading } =
    trpc.syncHistory.getByProjectId.useQuery({
      projectId,
    });

  if (isLoading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading sync history...
      </Typography>
    );
  }

  if (!syncHistory?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No sync history available
      </Typography>
    );
  }

  return (
    <SyncHistoryList>
      {syncHistory.map((sync) => (
        <SyncHistoryItem key={sync.id}>
          <SyncDetails>
            <Typography variant="body2">
              {(sync.details as SyncDetails).repository}:
              {(sync.details as SyncDetails).branch}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(sync.created_at), {
                addSuffix: true,
              })}
            </Typography>

            {(sync.details as SyncDetails).error && (
              <Typography variant="caption" color="error">
                Error: {(sync.details as SyncDetails).error}
              </Typography>
            )}

            {(sync.details as SyncDetails).message && (
              <Typography variant="caption" color="text.secondary">
                Message: {(sync.details as SyncDetails).message}
              </Typography>
            )}
          </SyncDetails>
          <Chip
            label={sync.status}
            color={sync.status === "success" ? "success" : "error"}
            size="small"
          />
        </SyncHistoryItem>
      ))}
    </SyncHistoryList>
  );
}
