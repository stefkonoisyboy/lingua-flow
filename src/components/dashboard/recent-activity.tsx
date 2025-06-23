"use client";

import {
  TranslateOutlined,
  AddCircleOutlineOutlined,
  CommentOutlined,
  LanguageOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoOutlined,
  FolderOutlined,
} from "@mui/icons-material";
import {
  ActivityContainer,
  ActivityTitle,
  ActivityDescription,
  ActivityList,
  ActivityItem,
  ActivityIcon,
  ActivityContent,
  ActivityText,
  ActivityTime,
} from "@/styles/dashboard/recent-activity.styles";
import { trpc } from "@/utils/trpc";
import { formatDistance } from "date-fns";
import { CircularProgress } from "@mui/material";

const getActivityIcon = (action: string, entity: string) => {
  if (action === "created") {
    if (entity === "language") return <AddCircleOutlineOutlined />;
    if (entity === "project") return <FolderOutlined />;
    return <AddCircleOutlineOutlined />;
  }

  if (action === "updated") {
    if (entity === "translation") return <TranslateOutlined />;
    return <EditOutlined />;
  }

  if (action === "deleted") {
    return <DeleteOutlined />;
  }

  if (action === "commented") {
    return <CommentOutlined />;
  }

  if (entity === "language") {
    return <LanguageOutlined />;
  }

  if (entity === "translation") {
    return <TranslateOutlined />;
  }

  return <EditOutlined />;
};

const RecentActivity = () => {
  const activities = trpc.dashboard.getRecentActivity.useQuery();

  return (
    <ActivityContainer>
      <ActivityTitle variant="h2">Recent Activity</ActivityTitle>
      <ActivityDescription>
        Latest updates and changes across your projects.
      </ActivityDescription>

      <ActivityList>
        {activities.isLoading ? (
          <ActivityItem>
            <CircularProgress size={24} />
            <ActivityContent>
              <ActivityText>Loading activities...</ActivityText>
            </ActivityContent>
          </ActivityItem>
        ) : activities.error ? (
          <ActivityItem>
            <ActivityIcon>
              <DeleteOutlined color="error" />
            </ActivityIcon>
            <ActivityContent>
              <ActivityText>
                Error loading activities: {activities.error.message}
              </ActivityText>
            </ActivityContent>
          </ActivityItem>
        ) : activities.data?.length === 0 ? (
          <ActivityItem>
            <ActivityIcon>
              <InfoOutlined />
            </ActivityIcon>
            <ActivityContent>
              <ActivityText>No recent activity yet.</ActivityText>
            </ActivityContent>
          </ActivityItem>
        ) : (
          activities.data?.map((activity) => (
            <ActivityItem key={activity.id}>
              <ActivityIcon>
                {getActivityIcon(activity.type, activity.resourceType ?? "")}
              </ActivityIcon>
              <ActivityContent>
                <ActivityText>
                  {activity.type} {activity.resourceType}{" "}
                  {activity.projectName && (
                    <>
                      in <strong>{activity.projectName}</strong>
                    </>
                  )}
                </ActivityText>
                <ActivityTime>
                  {formatDistance(new Date(activity.timestamp), new Date(), {
                    addSuffix: true,
                  })}
                </ActivityTime>
              </ActivityContent>
            </ActivityItem>
          ))
        )}
      </ActivityList>
    </ActivityContainer>
  );
};

export default RecentActivity;
