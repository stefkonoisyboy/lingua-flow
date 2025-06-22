"use client";

import {
  TranslateOutlined,
  AddCircleOutlineOutlined,
  CommentOutlined,
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

interface ActivityData {
  id: string;
  type: "translation" | "language" | "comment";
  user: string;
  action: string;
  project: string;
  details?: string;
  time: string;
}

const getActivityIcon = (type: ActivityData["type"]) => {
  switch (type) {
    case "translation":
      return <TranslateOutlined />;
    case "language":
      return <AddCircleOutlineOutlined />;
    case "comment":
      return <CommentOutlined />;
    default:
      return <TranslateOutlined />;
  }
};

const recentActivities: ActivityData[] = [
  {
    id: "1",
    type: "translation",
    user: "John Doe",
    action: "updated 'en' translations",
    project: "E-commerce Platform",
    time: "15 mins ago",
  },
  {
    id: "2",
    type: "language",
    user: "New language",
    action: "'Spanish' added to",
    project: "Mobile App Backend",
    time: "1 hour ago",
  },
  {
    id: "3",
    type: "comment",
    user: "Jane Smith",
    action: "commented on",
    project: "Marketing Website",
    details: "'homepage.title'",
    time: "3 hours ago",
  },
];

const RecentActivity = () => {
  return (
    <ActivityContainer>
      <ActivityTitle variant="h2">Recent Activity</ActivityTitle>
      <ActivityDescription>
        Latest updates and changes across your projects.
      </ActivityDescription>

      <ActivityList>
        {recentActivities.map((activity) => (
          <ActivityItem key={activity.id}>
            <ActivityIcon>{getActivityIcon(activity.type)}</ActivityIcon>
            <ActivityContent>
              <ActivityText>
                <strong>{activity.user}</strong> {activity.action}{" "}
                <strong>{activity.project}</strong>
                {activity.details && ` in ${activity.details}`}.
              </ActivityText>
              <ActivityTime>{activity.time}</ActivityTime>
            </ActivityContent>
          </ActivityItem>
        ))}
      </ActivityList>
    </ActivityContainer>
  );
};

export default RecentActivity;
