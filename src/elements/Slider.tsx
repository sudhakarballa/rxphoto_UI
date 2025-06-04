import { useFormContext } from "react-hook-form";

type props={
  item:any;
  selectedItem:any;
  onChange?:any;
  checked?:boolean;
  }
  const Slider: React.FC<props> = (props) => {
      console.log("Slider component rendered with props "+ props);
      const { item, selectedItem, onChange, checked, ...others } = props;
      const {register, formState: { errors }} = useFormContext();
      return (
        <>
          <label className={`switch ${item.disabled ? "disabled" : ""}`}>
            <input
              type="checkbox"
              id={item.value}
              disabled={item.disabled}
              defaultValue={selectedItem[item.value]}
              checked={checked}
              {...register(item.value)}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                let enabled: number = event.target.checked ? 1 : 0;
                console.log(
                  "event.target.value: ",
                  event.target.checked,
                  " | isEnabled: ",
                  enabled
                );
                onChange(event.target.checked);
              }}
            />
            <span className="slider round"></span>
          </label>
        </>
      );
  }
  
  export default Slider;