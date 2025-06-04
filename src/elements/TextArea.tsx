import { useFormContext } from "react-hook-form";

type params = {
    item: any;
    selectedItem: any;
    onChange?: any;
    disable?: boolean;
    value?:any;
    isValidationOptional?: boolean
}

const generatePlaceHolder = (item: any) => {
    let msg = item.min > 0 ? "min " + item.min + " & max " + item.max + " characters" : "max " + item.max + " characters";;
    return item.max ? item.key + " " + "can be " + msg : item.key;
}

const TextAreaWithValidations = (props: params) => {
    console.log("TextArea component rendered with props " + props);
    const { item, selectedItem, onChange, disable, value, ...others } = props;

    const { register, formState: { errors } } = useFormContext();

    return (
        <>
            <textarea id={item.value}
                maxLength={item.max}
                title={selectedItem.id == 0 ? generatePlaceHolder(item) : selectedItem[item.value]}
                placeholder={generatePlaceHolder(item)}
                className="form-control"
                autoComplete="off"
                defaultValue={value ? value : selectedItem[item.value]}
                {...register(item.value)}
                disabled={disable ?? item.disabled}
                onChange={(e)=>onChange(e.target.value)}
            />
            <p className="text-danger" id={`validationMsgfor_${item.value}`}>{(errors as any)?.[item.value]?.message}</p>
        </>
    )
}

const TextArea = (props: params) => {
    console.log("TextArea component rendered with props " + props);
    const { item, selectedItem, onChange, disable, isValidationOptional, ...others } = props;

    return (
        <>
            {isValidationOptional ?
                <textarea id={item.value}
                    maxLength={item.max}
                    title={selectedItem.id == 0 ? generatePlaceHolder(item) : selectedItem[item.value]}
                    placeholder={generatePlaceHolder(item)}
                    className="form-control"
                    autoComplete="off"
                    defaultValue={selectedItem[item.value]}
                    onBlur={onChange}
                    disabled={disable ?? item.disabled}
                    onChange={(event: any) => { }}
                />
                : <TextAreaWithValidations {...props} />
            }
        </>
    )
}

export default TextArea;