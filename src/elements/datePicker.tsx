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
            <Picker
                placeholderText="MM/DD/YYYY"
                showIcon
                dateFormat={"MM/d/yyyy"}
                selected={selectedItem[item.value] ? new Date(selectedItem[item.value]) : selectedItem[item.value]}
                className="form-control"
                showTimeSelect={item.showTimeSelect}
                disabled={disable}
                {...register(item.value)}
                onChange={(date:any) => 
                    {
                        
                        onChange(date as any)
                    }
                }
            />
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