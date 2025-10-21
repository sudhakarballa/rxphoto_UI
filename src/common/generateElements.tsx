import { useState } from "react";
import SelectDropdown from "../elements/SelectDropdown";
import Slider from "../elements/Slider";
import TextArea from "../elements/TextArea";
import TextBox from "../elements/TextBox";
import { DATEPICKER } from "../elements/datePicker";
import MultiSelectDropdown from "../elements/multiSelectDropdown";
// import RichTextEditor from "../elements/richTextEditor";
import { useFormContext } from "react-hook-form";
import {
  CustomActionPosition,
  ElementType,
  IControl,
} from "../models/iControl";
import { faCheck, faEdit, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type props = {
  controlsList: Array<any>;
  selectedItem: any;
  onChange?: any;
  checked?: any;
  getListofItemsForDropdown?: (item: any) => {};
  disable?: boolean;
  getCustomElement?: any;
  onSwitchableOptionChange?: any;
  getSelectedList?: any;
  defaultSwitch?: any;
  onElementDelete?:any;
  onElementEdit?:any;
  showDelete?: boolean; 
  getAttachedData?:any;
};
const GenerateElements: React.FC<props> = (props) => {
  
  const {
    controlsList,
    selectedItem,
    onChange,
    checked,
    getListofItemsForDropdown,
    disable,
    getCustomElement,
    defaultSwitch,
    onElementDelete,
    onElementEdit,
    ...others
  } = props;

  const methods = useFormContext();
  const { watch, setValue, register } = methods;
  const [selectedOption, SetSelectedOption] = useState(defaultSwitch);
  const [resetSwitchableElement, setResetSwitchableElement] = useState(false);
  const handleOptionChange = (item: any) => {
    setResetSwitchableElement(true);
    SetSelectedOption(item);
    props.onSwitchableOptionChange(item);
    setTimeout(() => {
      setResetSwitchableElement(false);
    });
  };

  const getElement = (
    item: IControl,
    elementType?: ElementType,
    forceDisable?: any
  ) => {
    let itemType = item?.isSwitchableElement ? elementType : item?.type;
    switch (itemType) {
      case ElementType.textarea:
        return (
          <TextArea item={item} selectedItem={selectedItem} disable={disable}   onChange={(e: any) => onChange && onChange(e, item)}/>
        );
      case ElementType.slider:
        return (
          <Slider
            item={item}
            selectedItem={selectedItem}
            onChange={(e: any) => onChange && onChange(e, item)}
            checked={checked}
          />
        );
      case ElementType.dropdown:
        return (
          <SelectDropdown
            item={item}
            selectedItem={selectedItem}
            disable={forceDisable ?? disable}
            list={
              getListofItemsForDropdown &&
              (getListofItemsForDropdown(item) as any)
            }
            onItemChange={(e: any) => onChange(e, item)}
            value={selectedItem[item.value]}
          />
        );
      case ElementType.multiSelectDropdown:
        return (
          <MultiSelectDropdown
            item={item}
            selectedItem={selectedItem}
            disable={forceDisable ?? disable}
            selectedList={props.getSelectedList(item)}
            list={
              getListofItemsForDropdown &&
              (getListofItemsForDropdown(item) as any)
            }
            onItemChange={(e: any) => onChange(e, item)}
          />
        );
      case ElementType.datepicker:
        return (
          <DATEPICKER
            item={item}
            selectedItem={selectedItem}
            disable={forceDisable ?? disable}
            onChange={(e: any) => {
              onChange && onChange(e, item);
            }}
          />
        );
      // case ElementType.ckeditor:
      //   return (
      //     <RichTextEditor
      //       item={item}
      //       selectedItem={selectedItem}
      //       onChange={(e: any) => {
              
      //         onChange && onChange(e, item);
      //       }}
      //       hideSpace={item.hideSpaceForEditor}
      //       value={selectedItem[item.value]}
      //       attachedData={props.getAttachedData ? props.getAttachedData() : []}
      //     />
      //   );
      case ElementType.checkbox: // Add checkbox handling
        return (
          <input
            type="checkbox"
            checked={watch(item.value)} // Bind the checkbox state to react-hook-form
            {...register(item.value)}
            onChange={(e) => setValue(item.value, e.target.checked)} // Update form value on change
            disabled={forceDisable ?? disable} // Handle disabling conditionally
          />
        );
      case ElementType.custom:
        return getCustomElement(item);
      default:
        return (
          <TextBox
            item={item}
            selectedItem={selectedItem}
            disable={forceDisable ?? disable}
            onChange={(e: any) => {
              onChange && onChange(e, item);
            }}
          />
        );
    }
  };

  const customActionElement = (item: IControl) => {
    if (!item) return;
    return (
      <>
        {item.customAction == CustomActionPosition.Right ? (
          <div className={item.actionName + " text-end"}>
            <a href="#">{item.actionName}</a>
          </div>
        ) : item.customAction == CustomActionPosition.Left ? (
          <div className={item.actionName}>
            <a href="#">{item.actionName}</a>
          </div>
        ) : null}
      </>
    );
  };

  const switchableElementLabels = (item: IControl) => {
    const labels = () => {
      return (
        <>
          <label className={`col-sm-6 col-form-label ${item.isRequired ? "required" : ""}`}>
            <label>
              <input
                className="form-group"
                type="radio"
                value={item?.label1}
                checked={selectedOption === item?.label1 || !selectedOption}
                onChange={(e: any) => handleOptionChange(item.label1)}
              />
              {item?.label1}
            </label>

            <label>
              <input
                className="form-group"
                type="radio"
                value={item.label2}
                checked={selectedOption === item.label2}
                onChange={(e: any) => handleOptionChange(item.label2)}
              />
              {item.label2}
            </label>
          </label>
        </>
      );
    };

    return (
      <>
        {!item.isControlInNewLine ? (
          <div className="form-group row">{labels()}</div>
        ) : (
          <div className="col-6">{labels()}</div>
        )}
      </>
    );
  };

  const switchableElement = (item: IControl) => {
    return (
      <>
        <div className="form-group row">
          <div className="col-md-12">
            {selectedOption === item.label1 || !selectedOption
              ? getElement(item, item.element2Type, true)
              : getElement(item, item.element2Type)}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {controlsList.map((item: IControl, index: number) => (
        item.isSwitchableElement && !item.isSideByItem ? (
          switchableElement(item)
        ) : item.isControlInNewLine &&
          !item.isSidebyItemHavingCustomLabels &&
          !item.isSwitchableElement ? (
          <div key={`control-${item.value}-${index}`}>
            {!item.dependentChildren && !item.isDependentChildren ? (
              <div>
                <div className="form-group row" hidden={item.hidden}>
                  <label
                    htmlFor="name"
                    id={`labelFor_${item.value}`}
                    className={`col-sm-${
                      item.labelSize ? item.labelSize : 6
                    } col-form-label ${item.isRequired ? "required" : ""}`}
                  >
                    {item.key}:
                  </label>
                </div>
                <div className="form-group row d-flex">
                  <div
                    className={`col-sm-${
                      item.elementSize ? item.elementSize : 6
                    } errmessage`}
                    hidden={item.hidden}
                  >
                    {getElement(item)}
                  </div>
                  <div className="col-sm-2 d-flex">
                    <div
                      hidden={!item.showEdit}
                      className="col-sm-10"
                    >
                      <button
                        className="editstage-deletebtn"
                        onClick={(e: any) => {
                          if (props.onElementEdit) onElementEdit(index);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                    <div hidden={!item.showDelete} className="col-sm-2">
                      <button
                        className="editstage-deletebtn"
                        onClick={(e: any) => {
                          if (props.onElementDelete) onElementDelete(index);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !item.isDependentChildren ? (
              <div className="form-group row">
                <label
                  htmlFor="name"
                  id={`labelFor_${item.value}`}
                  className={`col-sm-${
                    item.labelSize ? item.labelSize : null
                  } col-form-label ${item.isRequired ? "required" : ""}`}
                >
                  {item.key}:124
                </label>
                <div className="row">
                  <div className={`col-md-6 ${item.isRequired ? "required" : ""}`}>
                    {getElement(item)}
                    {customActionElement(item)}
                  </div>
                  <div className="col-md-6">
                    {getElement(
                      controlsList.find((c) => c.key === item.dependentChildren)
                    )}
                    {customActionElement(
                      controlsList.find((c) => c.key === item.dependentChildren)
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : item.sidebyItem ? (
          <>
            <div className="form-group row" key={`sideby-${item.value}-${index}`} hidden={item.hidden}>
              <div className="col-6">
                <label
                  htmlFor="name"
                  id={`labelFor_${item.value}`}
                  className={`col-sm-${
                    item.labelSize ? item.labelSize : 6
                  } col-form-label ${item.isRequired ? "required" : ""}`}
                >
                  {item.key}:
                </label>
              </div>

              {item.isSidebyItemHavingCustomLabels ? (
                switchableElementLabels(
                  controlsList.find((c) => c.key === item.sidebyItem)
                )
              ) : (
                <div className="col-6">
                  <label
                    htmlFor="name"
                    id={`labelFor_${controlsList.find(
                      (c) => c.key === item.sidebyItem
                    )}`}
                    className={`col-sm-${
                      controlsList.find((c) => c.key === item.sidebyItem)
                        ?.labelSize
                        ? controlsList.find((c) => c.key === item.sidebyItem)
                            ?.labelSize
                        : 6
                    } col-form-label ${
                      controlsList.find((c) => c.key === item.sidebyItem)
                        ?.isRequired
                        ? "required"
                        : ""
                    }`}
                  >
                    {controlsList.find((c) => c.key === item.sidebyItem)?.key}:
                  </label>
                </div>
              )}
            </div>

            <div className="form-group row">
              <div className={`col-6`}>{getElement(item)}</div>
              <div className="col-6">
                {controlsList.find((c) => c.key === item.sidebyItem)
                  ?.isSwitchableElement
                  ? resetSwitchableElement
                    ? null
                    : switchableElement(
                        controlsList.find((c) => c.key === item.sidebyItem)
                      )
                  : getElement(
                      controlsList.find((c) => c.key === item.sidebyItem)
                    )}
              </div>
              {props.showDelete && <div>Delete</div>}
            </div>
          </>
        ) : item.isSideByItem ? null : (
          <div className="form-group row" key={`${item.value}-${index}`} hidden={item.hidden}>
            <label
              style={{ textAlign: "left" }}
              hidden={item.hideLabel}
              htmlFor="name"
              id={`labelFor_${item.value}`}
              className={`col-sm-${item.labelSize ?? 1} col-form-label ${
                item.isRequired ? "required" : ""
              }`}
            >
              {item.key}:
            </label>
            <div
              className={`col-sm-${item.elementSize ?? 11} errmessage`}
              style={{ paddingBottom: "5px" }} hidden={item.hidden}
            >
              {getElement(item)}
            </div>
            {props.showDelete && <div>Delete</div>}
          </div>
        )
      ))}
    </>
  );
};

export default GenerateElements;
