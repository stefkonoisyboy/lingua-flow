import { useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { AutoAwesome, Check, Close } from "@mui/icons-material";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";

interface AISuggestionDisplayProps {
  translationKeyId: string;
  targetLanguageId: string;
  currentTranslation?: string;
  disabled?: boolean;
}

export const AISuggestionDisplay: React.FC<AISuggestionDisplayProps> = ({
  translationKeyId,
  targetLanguageId,
  currentTranslation,
  disabled = false,
}) => {
  const params = useParams();
  const projectId = params.projectId as string;

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const utils = trpc.useUtils();
  const getSuggestionMutation = trpc.aiSuggestions.getSuggestion.useMutation();

  const applySuggestionMutation =
    trpc.aiSuggestions.applySuggestion.useMutation({
      onSuccess: () => {
        utils.translations.getTranslationKeys.invalidate({ projectId });
        setSuggestion(null);
        setShowSuggestion(false);
      },
    });

  const handleGetSuggestion = async () => {
    try {
      const result = await getSuggestionMutation.mutateAsync({
        projectId,
        translationKeyId,
        targetLanguageId,
      });

      setSuggestion(result.suggestedText);
      setShowSuggestion(true);
    } catch (error) {
      console.error("Failed to get suggestion:", error);
    }
  };

  const handleApplySuggestion = async () => {
    if (!suggestion) {
      return;
    }

    try {
      await applySuggestionMutation.mutateAsync({
        projectId,
        translationKeyId,
        targetLanguageId,
        suggestedText: suggestion,
        modelUsed: "gemini-2.5-flash",
      });
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
    }
  };

  const handleRejectSuggestion = () => {
    setSuggestion(null);
    setShowSuggestion(false);
  };

  // Don't show anything if there's already a translation
  if (currentTranslation && currentTranslation.trim()) {
    return null;
  }

  // Show suggestion bar if we have a suggestion
  if (showSuggestion && suggestion) {
    return (
      <Box sx={{ mt: 1, p: 1, bgcolor: "primary.50", borderRadius: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <AutoAwesome sx={{ color: "primary.main", fontSize: 16 }} />
          <Typography variant="body2" color="primary.main" fontWeight="medium">
            Suggestion: {suggestion}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={handleApplySuggestion}
            disabled={disabled || applySuggestionMutation.isPending}
            startIcon={<Check />}
          >
            Apply
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={handleRejectSuggestion}
            disabled={disabled}
            startIcon={<Close />}
          >
            Reject
          </Button>
        </Box>
      </Box>
    );
  }

  // Show "Get AI Suggestion" button if no translation and no suggestion
  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={handleGetSuggestion}
        disabled={disabled || getSuggestionMutation.isPending}
        startIcon={
          getSuggestionMutation.isPending ? (
            <CircularProgress size={16} />
          ) : (
            <AutoAwesome />
          )
        }
      >
        {getSuggestionMutation.isPending ? "Loading..." : "Get AI Suggestion"}
      </Button>
    </Box>
  );
};
