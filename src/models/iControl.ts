export interface IControl {
  key: string;
  value: string;
  type?: ElementType;
  itemType?: string;
  isRequired?: boolean | true;
  hidden?: boolean | false;
  disabled?: boolean | false;
  placeHolder?: string;
  bind?: string;
  regex1?: any;
  errMsg1?: string;
  regex2?: any;
  errMsg2?: string;
  regex3?: any;
  errMsg3?: string;
  min?: number | null;
  max?: number | null;
  isControlInNewLine?: boolean | true;
  elementSize?: number;
  isFocus?: boolean;
  tabIndex?: number;
  dependentChildren?: string | null;
  isDependentChildren?: boolean | false;
  customAction?: CustomActionPosition | 2;
  actionName?: string;
  labelSize?: number;
  showEyeIcon?: boolean;
  sidebyItem?: string;
  isSidebyItemHavingCustomLabels?: boolean | false;
  isSideByItem?: boolean;
  hideLabel?: boolean;
  displayName?: string;
  isSwitchableElement?: boolean;
  label1?: string;
  label2?: string;
  element1Type?: ElementType;
  element2Type?: ElementType;
  hideSpaceForEditor?: boolean | false;
  showTimeSelect?: boolean | false;
  options?: { key: string; value: string }[];
  defaultValue?: any;
  showDelete?: boolean | false;
  showEdit?:boolean | false;
  pipelineIds?:string;
  bindable?:string;
}

export enum CustomActionPosition {
  Left,
  Right,
}

export enum ElementType {
  "textbox" = "Text Box",
  "textarea" = "Text Area",
  "dropdown" = "Dropdown",
  "multiSelectDropdown" = "Multiselect Dropdown",
  "slider" = "Slider",
  "password" = "Password Field",
  "number" = "Number Field",
  "custom" = "Custom",
  "datepicker" = "Datepicker",
  "ckeditor" = "RichText Editor",
  "checkbox" = "Checkbox",
}

export const ElementTypeMap = new Map<string, string>([
  ["textbox", "Text Box"],
  ["textarea", "Text Area"],
  ["dropdown", "Dropdown"],
  ["multiSelectDropdown", "Multiselect Dropdown"],
  ["slider", "Slider"],
  ["password", "Password Field"],
  ["number", "Number Field"],
  ["custom", "Custom"],
  ["datepicker", "Datepicker"],
  ["ckeditor", "RichText Editor"],
  ["checkbox", "Checkbox"],
]);

export const SwappedElementTypeMap = new Map<string, string>(
  Array.from(ElementTypeMap.entries()).map(([key, value]) => [value, key])
);