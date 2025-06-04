import { useFormContext } from "react-hook-form";

type params = {
    item?: any;
    selectedItem?: any;
    onItemChange?: any;
    list: Array<any>;
    disable?: boolean;
    isValidationOptional?: boolean;
    value?:any
    hideSelect?:boolean;
}

export const SelectDropdownWithValidation = (props: params) => {
    const { item, selectedItem, onItemChange, list, disable, isValidationOptional, value, hideSelect, ...others } = props;
    const { register, formState: { errors } } = useFormContext();

    return (
        <>
            <select className="form-control"
                id={item.value}
                key={"region"}
                disabled={disable ?? item.disabled}
                defaultValue={selectedItem[item.value]}
                value={value ?? selectedItem[item.value]}
                {...register(item.value)}
                onChange={(e: any) => onItemChange(e.target.value)}
            >
                <option value="" hidden={hideSelect}>Select</option>
                {list?.map((item: any, index: number) => {
                    return (
                        <option key={index} value={item.value}>{item.name}</option>
                    );
                })}
            </select>
            <p className="text-danger" id={`validationMsgfor_${item.value}`}>{(errors as any)?.[item.value]?.message}</p>
        </>
    );
}

const SelectDropdown = (props: params) => {
    

    const { item, selectedItem, onItemChange, list, disable, isValidationOptional, value, hideSelect, ...others } = props;

    return (
        <>
            {
                isValidationOptional ?
                <select className="form-control"
                id={value}
                key={"region"}
                defaultValue={value}
                onChange={(e: any) => onItemChange(e.target.value)}
            >
                <option value="" hidden={hideSelect}>Select</option>
                {list?.map((item: any, index: number) => {
                    return (
                        <option key={index} value={item.value}>{item.name}</option>
                    );
                }
                )}
            </select>
                    :
                    <>
                        <SelectDropdownWithValidation {...props} />
                    </>
            }
        </>
    )
}


export default SelectDropdown;