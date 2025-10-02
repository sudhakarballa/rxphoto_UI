import React, { useState } from "react";
import Picker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useFormContext } from "react-hook-form";

type params = {
    item?: any;
    selectedItem: any;
    onChange?: any;
    value?: any;
    disable?: boolean;
    isValidationOptional?: boolean;
}

export const DatePickerWithValidation = (props: params) => {
    const { item, selectedItem, value, onChange, disable, isValidationOptional, ...others } = props;
    const [startDate, setStartDate] = useState<Date>(new Date());

    const { register, formState: { errors } } = useFormContext();

    return (
        <>
            <div className="position-relative">
                <Picker
                    placeholderText="Select Date of Birth"
                    showIcon
                    dateFormat="MM/dd/yyyy"
                    selected={selectedItem[item.value] ? new Date(selectedItem[item.value]) : null}
                    className="form-control shadow-sm custom-datepicker"
                    showTimeSelect={item.showTimeSelect}
                    disabled={disable}
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    {...register(item.value)}
                    onChange={(date:any) => {
                        onChange(date as any)
                    }}
                />
            </div>
            <p className="text-danger" id={`validationMsgfor_${item.value}`}>{(errors as any)?.[item.value]?.message}</p>
        </>
    )
}

export const DATEPICKER = (props: params) => {

    const { item, selectedItem, value, onChange, disable, isValidationOptional, ...others } = props;

    return (
        <>
            {
                isValidationOptional ?
                    <Picker
                        placeholderText="MM/DD/YYYY"
                        showIcon
                        value={value}
                        selected={value}
                        disabled={disable}
                        className="form-control"
                        onChange={(date:any) => onChange(date as any)}
                    /> :
                    <>
                        <DatePickerWithValidation {...props} />
                    </>
            }
        </>
    );
};