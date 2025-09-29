import { AuditItem } from "./base/AuditNamedItem";

export class Client extends AuditItem {
  id!: number;
  name!: string;
  gender!:number;
  avatar!: any;
  firstName!: string;
  middleName!: string;
  lastName!: string;
  dateOfBirth!: any;
  email!: string;
  phone!: number;
  password!: string;
  userId!: number;
  referringDoctor!: number;
  lastVisit!: any;
  procedureName!:any;
  patientId:any;
}
