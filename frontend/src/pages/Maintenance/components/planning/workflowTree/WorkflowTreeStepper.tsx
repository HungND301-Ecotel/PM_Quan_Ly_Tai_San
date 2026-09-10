import React from "react";
import { Box } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { WorkflowStepData } from "./types";
import { StepCard } from "./StepCard";

interface Props {
  steps: WorkflowStepData[];
  activeStep: number;
  onSelectStep: (stepNumber: number) => void;
}

export const WorkflowTreeStepper: React.FC<Props> = ({
  steps,
  activeStep,
  onSelectStep,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
        overflowX: "auto",
        overflowY: "visible",
        pt: 2.5,
        pb: 1.5,
        px: 1,
        width: "100%",
      }}
    >
      {steps.map((step, idx) => {
        const isSelected = activeStep === step.stepNumber;

        return (
          <React.Fragment key={step.id}>
            <StepCard
              step={step}
              isSelected={isSelected}
              onClick={() => onSelectStep(step.stepNumber)}
            />

            {idx < steps.length - 1 && (
              <ChevronRightIcon
                sx={{
                  color: "#94a3b8",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};
