import React, { useRef, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { yupResolver } from "@hookform/resolvers/yup";
import { ElementType, IControl } from "../models/iControl";
import { useForm, FormProvider } from "react-hook-form";
import * as Yup from "yup";
import Util from "../others/util";
import GenerateElements from "../common/generateElements";
import { Client } from "../models/client";
import { toast } from "react-toastify";
import clientsData from "../mockData/clients.json";

interface PatientFormData {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  photo: string; // base64
}

type params = {
  showClientAddEdit: any;
  setShowClientAddEdit: any;
  selectedItem: any;
  setSelectedItem: any;
  onSave: any;
};

const ClientAddEdit = (props: params) => {
  const {
    showClientAddEdit,
    setShowClientAddEdit,
    selectedItem,
    setSelectedItem,
    ...others
  } = props;

  const header = (selectedItem.id > 0 ? "Edit" : "Add") + " Client";
  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    age: "",
    gender: "male",
    photo: "",
  });

  const doctors = [
    {
      doctorId: 1,
      doctorName: "Dr. Ayesha Khan",
      specialization: "Cardiologist",
    },
    {
      doctorId: 2,
      doctorName: "Dr. Rajeev Mehta",
      specialization: "Orthopedic Surgeon",
    },
    {
      doctorId: 3,
      doctorName: "Dr. Linda Gomes",
      specialization: "Pediatrician",
    },
    {
      doctorId: 4,
      doctorName: "Dr. Omar Sheikh",
      specialization: "Dermatologist",
    },
    {
      doctorId: 5,
      doctorName: "Dr. Neha Patil",
      specialization: "Gynecologist",
    },
  ];

  const genders = [
    { genderId: 1, genderName: "Male" },
    { genderId: 2, genderName: "Female" },
    { genderId: 3, genderName: "Other" },
    { genderId: 4, genderName: "Prefer not to say" },
  ];

  const [errors, setErrors] = useState<{ photo?: string }>({});
  const [cameraActive, setCameraActive] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);

  const controlsList: Array<IControl> = [
    {
      key: "First Name",
      value: "firstName",
      isRequired: true,
      elementSize: 6, // changed to 6 for side-by-side on md+
      sidebyItem: "Last Name",
    },
    {
      key: "Last Name",
      value: "lastName",
      isRequired: true,
      elementSize: 6,
      isSideByItem: true,
    },
    {
      key: "Gender",
      value: "gender",
      isRequired: true,
      type: ElementType.dropdown,
      elementSize: 6,
      sidebyItem: "DOB",
    },
    {
      key: "DOB",
      value: "dob",
      isRequired: true,
      type: ElementType.datepicker,
      elementSize: 6,
      isSideByItem: true,
    },
    {
      key: "Phone Number",
      type: ElementType.number,
      value: "phone",
      min: 0,
      isRequired: true,
      elementSize: 6,
      regex1: /^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/,
      errMsg1: "Please enter a valid phone number",
      sidebyItem: "Email Address",
    },
    {
      key: "Email Address",
      value: "email",
      isRequired: true,
      elementSize: 6,
      regex1: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errMsg1: "Please enter a valid email address",
      isSideByItem: true,
    },
    {
      key: "Password",
      value: "password",
      isRequired: true,
      type: ElementType.password,
      elementSize: 6,
      sidebyItem: "Created By",
    },
    {
      key: "Created By",
      value: "createdBy",
      isRequired: true,
      type: ElementType.dropdown,
      elementSize: 6,
      isSideByItem: true,
    },
    {
      key: "Referring Doctor",
      value: "referringDoctor",
      isRequired: true,
      type: ElementType.dropdown,
      elementSize: 6,
      sidebyItem: "Last Visit",
    },
    {
      key: "Last Visit",
      value: "lastVisit",
      type: ElementType.datepicker,
      elementSize: 6,
      isSideByItem: true,
    },
  ];

  const getValidationsSchema = (list: Array<any>) => {
    return Yup.object().shape({
      ...Util.buildValidations(list),
    });
  };

  const formOptions = {
    resolver: yupResolver(getValidationsSchema(controlsList)),
  };
  const methods = useForm(formOptions);
  const { handleSubmit, unregister, register, resetField, setValue, setError } =
    methods;

  useEffect(() => {
    // Detect mobile device for camera capture attribute
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          alert("Camera error: " + err);
          console.error(err);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  useEffect(() => {
    if (selectedItem?.id > 0) {
      setPhotoPreview(selectedItem.avatar);
      setValue("dob" as never, selectedItem.dob as never);
      setValue("lastVisit" as never, selectedItem.lastVisit as never);
    }
  }, [selectedItem, setValue]);

  const onSubmit = (item: any) => {
    setIsSubmitClicked(true);
    if (!photoPreview) return;

    let list: Array<Client> = clientsData as any;
    let obj: Client = new Client();
    Util.toClassObject(obj, item);
    obj.id = selectedItem.id ?? list.length + 1;
    obj.avatar = photoPreview;
    obj.name = obj.firstName + " " + obj.lastName;

    if (selectedItem.id > 0) {
      const index = list.findIndex((item) => item.id === selectedItem.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...obj };
      }
      toast.success("Client updated successfully");
    } else {
      list.push(obj);
      toast.success("Client added successfully");
    }

    localStorage.setItem("clientsList", JSON.stringify(list));
    setShowClientAddEdit(false);
    setSelectedItem(new Client());
    props.onSave();
  };

  const handleClose = () => {
    setShowModal(false);
    setCameraActive(false);
    setShowClientAddEdit(false);
  };

  if (!showModal) return null;

  const onChange = (value: any, item: any) => {
    debugger
    if (item.key === "DOB") {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setValue("dob" as never, parsedDate as never);
        setSelectedItem({ ...selectedItem, dob: parsedDate });
      }
      return;
    }
    if (item.key === "Last Visit") {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        setValue("lastVisit" as never, parsedDate as never);
        setSelectedItem({ ...selectedItem, lastVisit: parsedDate });
      }
      return;
    } else {
      setValue(item.value as never, value as never);
      setSelectedItem({ ...selectedItem, [item.value] : value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDropdownvalues = (item: any) => {
    if (item.key === "Created By" || item.key === "Referring Doctor") {
      return (
        doctors.map(({ doctorId, doctorName }) => ({
          name: doctorName,
          value: doctorId,
        })) ?? []
      );
    }

    if (item.key === "Gender") {
      return (
        genders.map(({ genderId, genderName }) => ({
          name: genderName,
          value: genderId,
        })) ?? []
      );
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <div
          className="modal show fade d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            role="document"
          >
            <div className="modal-content">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-header">
                  <h5 className="modal-title">{header}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleClose}
                  ></button>
                </div>
                <div
                  className="modal-body"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                  <div className="modal-body text-center mb-3">
                    <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-3">
                      <div
                        className="rounded-circle bg-light d-flex justify-content-center align-items-center"
                        style={{
                          width: 100,
                          height: 100,
                          backgroundSize: "cover",
                          backgroundImage: photoPreview
                            ? `url(${photoPreview})`
                            : "none",
                        }}
                      >
                        {!photoPreview && (
                          <i
                            className="bi bi-camera"
                            style={{ fontSize: "2rem", opacity: 0.3 }}
                          ></i>
                        )}
                      </div>
                      <div>
                        <small className="d-block mb-1 text-muted">
                          400x400 for best resolution
                        </small>
                        <label
                          htmlFor="photoInput"
                          className="btn btn-outline-primary btn-sm"
                        >
                          {isMobile ? "Take Photo" : "Upload New"}
                        </label>
                        <input
                          type="file"
                          id="photoInput"
                          accept="image/*"
                          capture={isMobile ? "environment" : undefined}
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                        />
                        {!photoPreview && isSubmitClicked && (
                          <div className="text-danger small mt-1">
                            Photo is required. Please capture a photo.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <GenerateElements
                    controlsList={controlsList}
                    selectedItem={selectedItem}
                    onChange={(value: any, item: any) => onChange(value, item)}
                    getListofItemsForDropdown={(e: any) =>
                      getDropdownvalues(e) as any
                    }
                  />
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary w-100">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Backdrop */}
        <div className="modal-backdrop fade show"></div>
      </FormProvider>
    </>
  );
};

export default ClientAddEdit;
