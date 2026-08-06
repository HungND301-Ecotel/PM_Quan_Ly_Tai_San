import {
  TextField,
  Box,
  Button,
  Typography,
  Popover,
  Grid,
  InputAdornment,
} from "@mui/material";
import React, { useState } from "react";
import { useField } from "formik";
import { ChevronLeft, ChevronRight, DateRange } from "@mui/icons-material";

export default function FieldYear({
  title,
  name,
  selectedYear,
  setSelectedYear,
  disabled = false,
}: {
  title: string;
  name?: string;
  selectedYear?: number;
  setSelectedYear?: (val: number) => void;
  disabled?: boolean;
}) {
  const isFormikMode = Boolean(name);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [field, , helpers] = isFormikMode
    ? useField(name as string)
    : [undefined, undefined, undefined];

  const value =
    (isFormikMode ? field!.value : selectedYear) ?? new Date().getFullYear();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [startYear, setStartYear] = useState(Math.floor(value / 10) * 10);

  const setValue = (val: number) => {
    if (isFormikMode && helpers) {
      helpers.setValue(val);
    } else {
      setSelectedYear?.(val);
    }
    setAnchorEl(null);
  };

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget as unknown as HTMLButtonElement);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const years = Array.from({ length: 12 }, (_, i) => startYear + i);

  return (
    <>
      <TextField
        label={title}
        value={value}
        onClick={handleOpen}
        fullWidth
        disabled={disabled}
        size="small"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <DateRange
                sx={{ cursor: "pointer", color: "#999" }}
                fontSize="small"
              />
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 1.5, minWidth: "280px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Button
              size="small"
              onClick={() => setStartYear(startYear - 10)}
              sx={{ minWidth: "auto" }}
            >
              <ChevronLeft fontSize="small" />
              <ChevronLeft fontSize="small" />
            </Button>
            <Typography
              sx={{ fontWeight: 600, textAlign: "center", fontSize: "13px" }}
            >
              {startYear} - {startYear + 11}
            </Typography>
            <Button
              size="small"
              onClick={() => setStartYear(startYear + 10)}
              sx={{ minWidth: "auto" }}
            >
              <ChevronRight fontSize="small" />
              <ChevronRight fontSize="small" />
            </Button>
          </Box>

          <Grid container spacing={0.8}>
            {years.map((year) => (
              <Grid size={{ xs: 4 }} key={year}>
                <Button
                  fullWidth
                  onClick={() => setValue(year)}
                  sx={{
                    py: 0.8,
                    fontSize: "12px",
                    border:
                      value === year
                        ? "2px solid #2196f3"
                        : "1px solid #e0e0e0",
                    borderRadius: "6px",
                    bgcolor: value === year ? "#e3f2fd" : "#fafafa",
                    color: value === year ? "#2196f3" : "#333",
                    fontWeight: value === year ? 600 : 400,
                    "&:hover": {
                      bgcolor: value === year ? "#e3f2fd" : "#f0f0f0",
                    },
                  }}
                >
                  {year}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    </>
  );
}
