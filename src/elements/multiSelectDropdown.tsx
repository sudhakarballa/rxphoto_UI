import React, { useState, useEffect } from "react";
import Multiselect from "multiselect-react-dropdown";
import { useFormContext } from "react-hook-form";

type Params = {
  item?: any;
  onItemChange?: (selectedItems: string) => void;
  list: Array<any>;
  selectedList: Array<any>;
  isValidationOptional?: boolean;
  selectedItem?: any;
  disable?: any;
};

const MultiSelectDropdownWithValidations = (props: Params) => {
  
  const { item, onItemChange, list, selectedList, isValidationOptional } = props;

  let register: any;
  let errors: any;

  let formContextAvailable = true;
  try {
    const methods = useFormContext();
    register = methods.register;
    errors = methods.formState.errors;
  } catch (error) {
    formContextAvailable = false;
  }

  const [options, setOptions] = useState([{ name: "Select All", value: "all" }, ...list]);
  const [selectedValues, setSelectedValues] = useState(selectedList);

  useEffect(() => {
    setOptions([{ name: "Select All", value: "all" }, ...list]);
  }, [list]);

  useEffect(() => {
    setSelectedValues(selectedList);
  }, [selectedList]);

  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll(".chip").forEach((chip: any) => {
        if (chip?.textContent?.trim() === "Select All") {
          chip.style.display = "none";
        }
      });
    }, 100);
  }, [selectedValues]);

  const onSelect = (selected: any) => {
    const isSelectAllClicked = selected.some((item: any) => item.value === "all");

    if (isSelectAllClicked) {
      if (selectedValues.length === list.length) {
        setSelectedValues([]);
        onItemChange?.("");
      } else {
        setSelectedValues([{ name: "Select All", value: "all" }, ...list]);
        onItemChange?.(list.map((x) => x[item?.bindable ?? "name"]).join(","));
      }
    } else {
      const allSelected = selected.length === list.length;
      setSelectedValues(allSelected ? [{ name: "Select All", value: "all" }, ...selected] : selected);
      onItemChange?.(selected.filter((i: any) => i.value !== "all").map((x: any) => x[item?.bindable ?? "name"]).join(","));
    }
  };

  const onRemove = (selected: any, selectedItem: any) => {
    let updatedSelected = selected;
    if (selectedItem.value === "all") {
      updatedSelected = [];
    }
    setSelectedValues(updatedSelected.filter((i:any) => i.value !== "all"));
    onItemChange?.(updatedSelected.map((x: any) => x[item?.bindable ?? "name"]).join(","));
  };

  return (
    <>
      {!isValidationOptional && formContextAvailable ? (
        <>
          <Multiselect
            showCheckbox
            options={options}
            selectedValues={selectedValues}
            onSelect={onSelect}
            onRemove={onRemove}
            displayValue="name"
            {...(register && item?.value ? register(item?.value) : {})}
          />
          <p className="text-danger" id={`validationMsgfor_${item?.value}`}>
            {errors?.[item?.value]?.message}
          </p>
        </>
      ) : (
        <Multiselect
          showCheckbox
          options={options}
          selectedValues={selectedValues}
          onSelect={onSelect}
          onRemove={onRemove}
          displayValue="name"
        />
      )}
    </>
  );
};

const MultiSelectDropdown = (props: Params) => {
  return <MultiSelectDropdownWithValidations {...props} />;
};

export default MultiSelectDropdown;
