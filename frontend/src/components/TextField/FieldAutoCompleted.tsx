import {
  Autocomplete,
  TextField,
  Box,
  createFilterOptions,
  Popper,
} from "@mui/material";
import { getIn } from "formik";
import { useMemo } from "react";

interface Props {
  title: string;
  data: any[];
  labelkey: string;
  formik?: any;
  field?: string;
  disabled?: boolean;
  labelOption?: string;
  onChange?: (newValue: any) => void;
  onSearch?: (value: string) => void;
  componentsProps?: any;
  autocompleteSx?: any;
  limitOptions?: number;
  value?: any;
  setValue?: (val: any) => void;
  multiple?: boolean;
  noBorder?: boolean;
  fontSize?: string;
  anchorRight?: boolean;
}

export default function FieldAutoCompleted({
  title,
  data = [],
  labelkey,
  formik,
  field,
  disabled,
  onChange,
  onSearch,
  labelOption,
  componentsProps,
  autocompleteSx,
  limitOptions = 10,
  value: valueProp,
  setValue: setValueProp,
  multiple,
  noBorder,
  fontSize,
  anchorRight,
}: Props) {
  // ... (omitting middle for brevity, but I should provide the full block in a real tool call)
  // actually I'll just use shorter chunks

  const currentValue =
    formik && field ? getIn(formik.values, field) : valueProp;
  const touched = field ? getIn(formik.touched, field) : false;
  const error = field ? getIn(formik.errors, field) : null;

  const filter = useMemo(() => {
    return limitOptions
      ? createFilterOptions<any>({ limit: limitOptions })
      : undefined;
  }, [limitOptions]);

  const selectedOption = useMemo(() => {
    if (multiple && Array.isArray(currentValue)) {
      const selectedItems = currentValue
        .map((item: any) =>
          data.find((datum) => datum.id?.toString() === item?.toString()),
        )
        .filter(Boolean);
      if (selectedItems.length === currentValue.length) {
        return selectedItems;
      }
      return selectedItems;
    }

    // 1. Tìm trong data trước (Logic gốc)
    const found = data.find(
      (i) => i.id?.toString() === currentValue?.toString(),
    );

    if (found) return found;

    // 2. Logic dự phòng: Nếu không thấy trong data nhưng có currentValue và formik
    if (currentValue && formik && field) {
      const parentPath = field.includes(".")
        ? field.substring(0, field.lastIndexOf("."))
        : "";

      // Nếu là mảng (có parentPath), tìm field label cùng cấp
      // Nếu không có parentPath (field đơn), thì labelValue sẽ khó tìm hơn nên trả về null
      const labelPath = parentPath ? `${parentPath}.${labelkey}` : "";
      const labelValue = labelPath ? getIn(formik.values, labelPath) : null;

      if (labelValue) {
        // Trả về object "giả" để Autocomplete có cái mà hiển thị nhãn
        return { id: currentValue, [labelkey]: labelValue };
      }
    }

    return multiple ? [] : null;
    // Thêm data vào dependency để khi listAssets từ API về, nó sẽ tính toán lại và khớp với hàng thật
  }, [currentValue, data, formik?.values, field, labelkey, multiple]);

  return (
    <Autocomplete
      sx={autocompleteSx}
      componentsProps={{
        ...componentsProps,
        paper: {
          ...componentsProps?.paper,
          sx: {
            ...(componentsProps?.paper?.sx || {}),
          },
        },
      }}
      PopperComponent={(props) => (
        <Popper
          {...props}
          style={{
            ...props.style,
            width: "max-content",
            minWidth: props.style?.width,
            maxWidth: "1000px",
          }}
          placement={anchorRight ? "bottom-end" : "bottom-start"}
        />
      )}
      disabled={disabled}
      fullWidth
      options={data}
      {...(filter ? { filterOptions: filter } : {})}
      getOptionLabel={(option: any) => {
        if (!option) return ""; // Tránh lỗi khi option là null/undefined
        if (typeof option === "string") return option; // Tránh lỗi nếu truyền string vào thay vì object

        return `${(labelOption && `${option[labelOption]} -`) || ""} ${option[labelkey] || ""}`.trim();
      }}
      isOptionEqualToValue={(option, value) => {
        if (!value) return false;
        return option?.id?.toString() === (value?.id || value)?.toString();
      }}
      value={selectedOption}
      multiple={multiple}
      onChange={(e, newValue) => {
        if (formik && field) {
          if (multiple) {
            formik.setFieldValue(
              field,
              Array.isArray(newValue)
                ? newValue.map((item: any) => item?.id)
                : [],
              true,
            );
          } else {
            formik.setFieldValue(field, newValue?.id, true);
          }
          formik.setFieldError(field, undefined);
        }
        if (onChange) {
          onChange(newValue);
        }
        if (setValueProp) {
          if (multiple) {
            setValueProp(
              Array.isArray(newValue)
                ? newValue.map((item: any) => item?.id)
                : [],
            );
          } else {
            setValueProp(newValue?.id || "");
          }
        }
      }}
      onInputChange={(_, value) => onSearch?.(value)}
      renderOption={(props, option, state) => {
        const label = `${
          labelOption ? `${option[labelOption]} -` : ""
        } ${option[labelkey] || ""}`;

        return (
          <li
            {...props}
            key={`${option.id} - ${state.index}`}
            title={label} // tooltip native
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
              display: "block",
            }}
          >
            {label}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={title}
          error={Boolean(touched && error)}
          helperText={touched ? error : ""}
          onBlur={() => {
            if (formik && field) {
              formik.setFieldTouched(field, true, true);
            }
          }}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                border: noBorder ? "none" : undefined,
                borderBottom: noBorder
                  ? "1px solid rgba(0, 0, 0, 0.23)"
                  : undefined,
                borderRadius: noBorder ? 0 : undefined,
              },
              "&:hover fieldset": {
                borderBottom: noBorder
                  ? "1px solid rgba(0, 0, 0, 0.87)"
                  : undefined,
              },
              "&.Mui-focused fieldset": {
                borderBottom: noBorder ? "2px solid #1976d2" : undefined,
              },
            },
            "& .MuiInputBase-input": {
              fontSize: fontSize || "inherit", // 🖋️ chỉnh font chữ
            },
          }}
        />
      )}
    />
  );
}
