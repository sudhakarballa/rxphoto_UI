import { Client } from "../models/client";
import axios, { AxiosResponse, AxiosError, CancelTokenSource } from "axios";

export class PatientService {
    postItem(item: any) {

        

        var promise = new Promise<any>((resolve, reject) => {
            axios({
                method: 'POST',
               // url: `https://www.y1crm.com/PLMSDev/api/PlmsPhoto/plmsphoto`,
                url:`https://localhost:44302/api/PlmsPhoto/plmsphoto`,
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Media-type': 'application/json'
                },
                data: item,
            }).then((res: AxiosResponse) => {
                console.log("postItem - res: ", res);
                
                resolve(res.data);
            }).catch((err: AxiosError) => {
                console.log("Exception Occurred - res: ", err, " | Code: ", err.code, " | err.message", err.message,);
            });
        });
        return promise;
    }



}