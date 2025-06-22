import {
  StatsCardContainer,
  StatsCardContent,
  StatsValue,
  StatsLabel,
  StatsIcon,
  StatsSubtext,
} from "@/styles/dashboard/stats-card.styles";

interface StatsCardProps {
  value: string | number;
  label: string;
  subtext?: string;
  icon: React.ReactNode;
  mode?: "default" | "warning";
}

const StatsCard = ({
  value,
  label,
  subtext,
  icon,
  mode = "default",
}: StatsCardProps) => {
  return (
    <StatsCardContainer mode={mode}>
      <StatsCardContent>
        <div>
          <StatsValue variant="h3" mode={mode}>
            {value}
          </StatsValue>
          <StatsLabel>{label}</StatsLabel>
          {subtext && <StatsSubtext>{subtext}</StatsSubtext>}
        </div>
        <StatsIcon mode={mode}>{icon}</StatsIcon>
      </StatsCardContent>
    </StatsCardContainer>
  );
};

export default StatsCard;
