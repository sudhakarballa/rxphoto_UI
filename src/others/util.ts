import { IControl } from "../models/iControl";
import * as Yup from "yup";

export default class Util {
  
  public static toClassObject(item: any, data: any) {
    //updates item props with data props
    Object.keys(item).forEach((key: any) => {
      if (data[key] != null) {
        item[key] = data[key] ? data[key] : null;
      }
    });
    return item;
  }

  public static buildValidations = (controlsList: IControl[]) => {
    const validateObj = {};
    controlsList
      ?.filter((i) => !i.hidden || Util.isNullOrUndefinedOrEmpty(i.hidden))
      .map((field: any) => {
        if (field.isRequired && !field.disabled) {
          if (field.min && !field.max) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .min(
                  field.min,
                  `${field.key} must be atleast ${field.min} chars`
                )
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
          if (field.max && !field.min) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .max(field.max, `${field.key} must be max ${field.max} chars`)
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
          if (!field.max && !field.min) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
          if (field.min && field.max) {
            Object.assign(validateObj, {
              [field.value]: Yup.string()
                .required(`${field.key} is required`)
                .min(
                  field.min,
                  `${field.key} must be atleast ${field.min} chars`
                )
                .max(field.max, `${field.key} must be max ${field.max} chars`)
                .matches(field.regex1 ?? "", field.errMsg1)
                .matches(field.regex2 ?? "", field.errMsg2)
                .matches(field.regex3 ?? "", field.errMsg3)
                .nullable(),
            });
          }
        } else {
          Object.assign(validateObj, {
            [field.value]: Yup.string().nullable(),
          });
        }
      });
    return validateObj;
  };

  public static isNullOrUndefined(list: any): boolean {
    return list === null || list === undefined;
  }

  public static isNullOrUndefinedOrEmpty(list: any): boolean {
    return list === null || list === undefined || list.length === 0;
  }

  public static isListNullOrUndefinedOrEmpty(list: any): boolean {
    return (
      list === null ||
      list === undefined ||
      list.length === 0 ||
      (list.length === 1 && (list[0] === null || list[0] === ""))
    );
  }
}
