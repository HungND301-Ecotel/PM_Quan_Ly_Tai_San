import React from "react";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { useField } from "formik";

export default function FieldDateTime({
  title,
  name,
  selectedDate,
  setSelectedDate,
  disabled = false,
  minutesStep = 1,
}: {
  title: string;
  name?: string;
  selectedDate?: string;
  setSelectedDate?: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
  minutesStep?: number;
}) {
  const isFormikMode = Boolean(name);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [field, meta, helpers] = isFormikMode
    ? useField(name as string)
    : [undefined, undefined, undefined];

  const value = isFormikMode ? field!.value : selectedDate;
  const touched = isFormikMode ? meta!.touched : false;
  const error = isFormikMode ? meta!.error : "";

  const setValue = (val: string) => {
    if (isFormikMode && helpers) {
      helpers.setValue(val);
      helpers.setTouched(true, false);
    } else {
      setSelectedDate?.(val);
    }
  };

  const dayjsValue: Dayjs | null = value ? dayjs(value) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <DateTimePicker
        label={title}
        format="DD/MM/YYYY HH:mm:ss"
        openTo="day"
        value={dayjsValue}
        disabled={disabled}
        onChange={(val) =>
          setValue(val ? dayjs(val).format("YYYY-MM-DD HH:mm:ss") : "")
        }
        timeSteps={{ minutes: minutesStep }}
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            error: Boolean(touched && error),
            helperText: touched && error,
          },
        }}
      />
    </LocalizationProvider>
  );
}
