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
import faceFrontOverlay from "./images/face-front.svg";
import faceLeftOverlay from "./images/face-left-profile.svg";
import faceRightOverlay from "./images/face-right-profile.svg";
import bodyFrontOverlay from "./images/body-front.svg";
import bodyBackOverlay from "./images/body-back.svg";
import throatOverlay from "./images/throat-profile.svg";
import masculineOverlay from "./images/face-masculine.svg";
import { PatientService } from "../services/PatientService"

let PatientFormData: {
  FirstName: string;
  LastName: string;
  Email: string;
  PatientId: string;
  ProceduralName:string;
  DateOfBirth:string;
  id:number;
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
    onSave,
  } = props;
const patientSvc = new PatientService();
  const header = (selectedItem.id > 0 ? "Edit" : "Add") + " Client";

  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");
  const [currentAngle, setCurrentAngle] = useState<string>("");
  const [capturedPhotos, setCapturedPhotos] = useState<{[key: string]: string}>({});
  const [requiredAngles, setRequiredAngles] = useState<string[]>([]);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
  }, []);

  const controlsList: Array<IControl> = [
    {
      key: "First Name",
      value: "firstName",
      isRequired: true,
      elementSize: 6,
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
      key: "Email",
      value: "email",
      isRequired: true,
      elementSize: 6,
      sidebyItem: "Patient Id",
    },
    {
      key: "Patient Id",
      value: "patientId",
      isRequired: true,
      elementSize: 6,
      isSideByItem: true,
    },
    {
      key: "Procedure Name",
      value: "procedureName",
      isRequired: true,
      elementSize: 6,
      sidebyItem: "DateOfBirth",
       type: ElementType.dropdown
    },
    {
      key: "DateOfBirth",
      value: "dateOfBirth",
      isRequired: true,
      elementSize: 6,
      isSideByItem: true,
    }
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
  const { handleSubmit, setValue } = methods;

  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: cameraFacing } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((err) => {
          alert("Camera error: " + err);
          setCameraActive(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
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
      setSignaturePreview(selectedItem.signature || null);
      setSelectedProcedure(selectedItem.procedureName || "");
      setValue("dob" as never, selectedItem.dob as never);
      setValue("lastVisit" as never, selectedItem.lastVisit as never);
    }
  }, [selectedItem]);

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const ctx = signatureCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const rect = signatureCanvasRef.current?.getBoundingClientRect();
    let x, y;
    if ("touches" in event) {
      x = event.touches[0].clientX - (rect?.left ?? 0);
      y = event.touches[0].clientY - (rect?.top ?? 0);
    } else {
      x = event.clientX - (rect?.left ?? 0);
      y = event.clientY - (rect?.top ?? 0);
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const ctx = signatureCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const rect = signatureCanvasRef.current?.getBoundingClientRect();
    let x, y;
    if ("touches" in event) {
      x = event.touches[0].clientX - (rect?.left ?? 0);
      y = event.touches[0].clientY - (rect?.top ?? 0);
    } else {
      x = event.clientX - (rect?.left ?? 0);
      y = event.clientY - (rect?.top ?? 0);
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignaturePreview(null);
  };

  // New function to get signature image data from canvas
  const getSignatureDataUrl = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;

    // Check if canvas is blank (optional)
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      return null; // blank canvas
    }

    return canvas.toDataURL("image/png");
  };

  const onSubmit = (item: any) => {
    setIsSubmitClicked(true);

    if (requiredAngles.length > 0 && Object.keys(capturedPhotos).length < requiredAngles.length) {
      toast.error(`Please capture all required photos: ${requiredAngles.join(", ")}`);
      return;
    }

    if (!photoPreview && Object.keys(capturedPhotos).length === 0) {
      toast.error("Photo is required.");
      return;
    }

    // On mobile, save signature from canvas automatically here
    let finalSignature = signaturePreview;
    if (isMobile) {
      const dataUrl = getSignatureDataUrl();
      if (!dataUrl) {
        toast.error("Signature is required on mobile.");
        return;
      }
      finalSignature = dataUrl;
      setSignaturePreview(dataUrl); // Save for preview after submit
    }

    let list: Array<Client> = clientsData as any;
    let obj: Client = new Client();
    Util.toClassObject(obj, item);
    let patient:any;
    obj.id = selectedItem.id ?? list.length + 1;
    //obj.avatar = photoPreview;
    //obj.signature = finalSignature || null;
    //obj.name = obj.firstName + " " + obj.lastName;
    
    debugger
    console.log(obj);


    if (selectedItem.id > 0) {
      const index = list.findIndex((i) => i.id === selectedItem.id);
      if (index !== -1) list[index] = { ...list[index], ...obj };
      toast.success("Client updated successfully");
    } else {
      list.push(obj);
      patientSvc.postItem(obj);
      toast.success("Client added successfully");
    }

    localStorage.setItem("clientsList", JSON.stringify(list));
    setShowClientAddEdit(false);
    setSelectedItem(new Client());
    onSave();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validatePhotoAlignment = (imageData: string, angle: string): boolean => {
    // Simulate more realistic validation that fails more often to demonstrate warnings
    const validationRules = {
      'Left Profile': () => {
        // For left profile, check if face is turned left
        return Math.random() > 0.6; // 40% success rate - more failures to show warnings
      },
      'Right Profile': () => {
        // For right profile, check if face is turned right
        return Math.random() > 0.6; // 40% success rate
      },
      'Front': () => {
        // For front view, check if face is centered
        return Math.random() > 0.5; // 50% success rate
      },
      'Back': () => {
        // For back view, validate back of head/body is visible
        return Math.random() > 0.6; // 40% success rate
      },
      'Left Side': () => {
        return Math.random() > 0.6; // 40% success rate
      },
      'Right Side': () => {
        return Math.random() > 0.6; // 40% success rate
      }
    };

    const validator = validationRules[angle as keyof typeof validationRules];
    return validator ? validator() : Math.random() > 0.5;
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !currentAngle) return;
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, width, height);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    
    if (!validatePhotoAlignment(dataUrl, currentAngle)) {
      const errorMessages = {
        'Left Profile': 'Please turn your head to the left and show your left profile',
        'Right Profile': 'Please turn your head to the right and show your right profile', 
        'Front': 'Please face the camera directly',
        'Back': 'Please turn around and show your back',
        'Left Side': 'Please turn your body to show the left side',
        'Right Side': 'Please turn your body to show the right side'
      };
      
      const message = errorMessages[currentAngle as keyof typeof errorMessages] || `Please align properly for ${currentAngle} angle`;
      toast.error(message);
      return;
    }
    
    setCapturedPhotos(prev => ({ ...prev, [currentAngle]: dataUrl }));
    toast.success(`${currentAngle} photo captured!`);
    
    const nextAngleIndex = requiredAngles.indexOf(currentAngle) + 1;
    if (nextAngleIndex < requiredAngles.length) {
      setCurrentAngle(requiredAngles[nextAngleIndex]);
    } else {
      setPhotoPreview(dataUrl);
      setCameraActive(false);
    }
  };

  const handleClose = () => {
    setShowClientAddEdit(false);
    setCameraActive(false);
  };

  const getDropdownvalues = (item: any) => {
    const procedure=[
      { procedureId: "Brow Lift", procedureName: "Brow Lift" },
      { procedureId: "Body Feminisation", procedureName: "Body Feminisation" },
      { procedureId: "Voice and Throat", procedureName: "Voice and Throat" },
      { procedureId: "Facial Masculinisation", procedureName: "Facial Masculinisation" }
    ]

    const doctors = [
      { doctorId: 1, doctorName: "Dr. Ayesha Khan" },
      { doctorId: 2, doctorName: "Dr. Rajeev Mehta" },
      { doctorId: 3, doctorName: "Dr. Linda Gomes" },
      { doctorId: 4, doctorName: "Dr. Omar Sheikh" },
      { doctorId: 5, doctorName: "Dr. Neha Patil" },
    ];
    const genders = [
      { genderId: 1, genderName: "Male" },
      { genderId: 2, genderName: "Female" },
      { genderId: 3, genderName: "Other" },
    ];
    if (item.key === "Created By" || item.key === "Referring Doctor") {
      return doctors.map(({ doctorId, doctorName }) => ({
        name: doctorName,
        value: doctorId,
      }));
    }
    if (item.key === "Procedure Name") {
      return procedure.map(({ procedureId, procedureName }) => ({
        name: procedureName,
        value: procedureId,
      }));
    }
    return [];
  };

  const getProcedureAngles = (procedure: string) => {
    switch (procedure) {
      case "Brow Lift":
        return ["Front", "Left Profile", "Right Profile"];
      case "Body Feminisation":
        return ["Front", "Back", "Left Side", "Right Side"];
      case "Voice and Throat":
        return ["Front", "Left Profile", "Right Profile"];
      case "Facial Masculinisation":
        return ["Front", "Left Profile", "Right Profile", "3/4 Left", "3/4 Right"];
      default:
        return ["Front"];
    }
  };

  const getOverlayImage = () => {
    const key = `${selectedProcedure}-${currentAngle}`;
    switch (key) {
      case "Brow Lift-Front":
      case "Facial Masculinisation-Front":
        return faceFrontOverlay;
      case "Brow Lift-Left Profile":
      case "Facial Masculinisation-Left Profile":
      case "Voice and Throat-Left Profile":
        return faceLeftOverlay;
      case "Brow Lift-Right Profile":
      case "Facial Masculinisation-Right Profile":
      case "Voice and Throat-Right Profile":
        return faceRightOverlay;
      case "Body Feminisation-Front":
        return bodyFrontOverlay;
      case "Body Feminisation-Back":
        return bodyBackOverlay;
      case "Voice and Throat-Front":
        return throatOverlay;
      default:
        return faceFrontOverlay;
    }
  };

  const onChange = (value: any, item: any) => {
    if (item.key === "Procedure Name") {
      setSelectedProcedure(value);
      const angles = getProcedureAngles(value);
      setRequiredAngles(angles);
      setCurrentAngle(angles[0] || "");
      setCapturedPhotos({});
    }
    if (item.key === "DOB") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setValue("dob" as never, date as never);
        setSelectedItem({ ...selectedItem, dob: date });
      }
      return;
    }
    if (item.key === "Last Visit") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setValue("lastVisit" as never, date as never);
        setSelectedItem({ ...selectedItem, lastVisit: date });
      }
      return;
    }
    setValue(item.value as never, value as never);
    setSelectedItem({ ...selectedItem, [item.value]: value });
  };

  return (
    <FormProvider {...methods}>
      <div
        className={isMobile ? "" : "modal show fade d-block"}
        style={
          isMobile
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "white",
                zIndex: 1050,
                overflowY: "auto",
              }
            : {}
        }
      >
        <div
          className={
            isMobile ? "p-3" : "modal-dialog modal-dialog-centered modal-lg"
          }
        >
          <div
            className="modal-content"
            style={isMobile ? { border: "none" } : {}}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-header">
                <h5 className="modal-title">{header}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleClose}
                />
              </div>

              <div className="modal-body">
                {/* Photo Capture Section */}
                <div className="text-center mb-3">
                  <div className="d-flex flex-column align-items-center gap-3">
                    {isMobile && cameraActive ? (
                      <div
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          backgroundColor: "black",
                          zIndex: 1060,
                        }}
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        {selectedProcedure && (
                          <img
                            src={getOverlayImage()}
                            alt={`${selectedProcedure} Guide`}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              pointerEvents: "none",
                              opacity: 0.6,
                              objectFit: "contain",
                            }}
                          />
                        )}
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            color: "white",
                            background: "rgba(0,0,0,0.8)",
                            padding: "10px 15px",
                            borderRadius: "5px",
                            fontSize: "14px",
                          }}
                        >
                          <div>{selectedProcedure}</div>
                          <div>Angle: {currentAngle}</div>
                          <div>{Object.keys(capturedPhotos).length + 1}/{requiredAngles.length}</div>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            color: "white",
                            background: "rgba(0,0,0,0.8)",
                            padding: "10px 15px",
                            borderRadius: "5px",
                            fontSize: "12px",
                            maxWidth: "150px",
                          }}
                        >
                          {(() => {
                            switch (currentAngle) {
                              case "Front":
                                return "Face camera directly";
                              case "Left Profile":
                                return "Turn head left, show profile";
                              case "Right Profile":
                                return "Turn head right, show profile";
                              case "Back":
                                return "Turn around, show back";
                              case "Left Side":
                                return "Turn body left";
                              case "Right Side":
                                return "Turn body right";
                              default:
                                return "Align with overlay";
                            }
                          })()}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: 10,
                            transform: "translateY(-50%)",
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setCameraFacing(prev => prev === "user" ? "environment" : "user");
                              setCameraActive(false);
                              setTimeout(() => setCameraActive(true), 100);
                            }}
                            style={{ padding: "8px" }}
                          >
                            🔄
                          </button>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: 20,
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-light"
                              onClick={handleCapturePhoto}
                            >
                              Capture {currentAngle}
                            </button>
                            {Object.keys(capturedPhotos).length > 0 && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setCameraActive(false)}
                              >
                                Done ({Object.keys(capturedPhotos).length})
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="rounded-circle bg-light position-relative d-flex justify-content-center align-items-center"
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
                          />
                        )}
                      </div>
                    )}

                    <div>
                      {!isMobile && (
                        <>
                          <small className="d-block mb-1 text-muted">
                            400x400 for best resolution
                          </small>
                          <label
                            htmlFor="photoInput"
                            className="btn btn-outline-primary btn-sm"
                          >
                            Upload New
                          </label>
                          <input
                            type="file"
                            id="photoInput"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                          />
                        </>
                      )}
                      {isMobile && !cameraActive && (
                        <>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              if (!selectedProcedure) {
                                toast.error("Please select a Procedure first");
                                return;
                              }
                              const angles = getProcedureAngles(selectedProcedure);
                              setRequiredAngles(angles);
                              setCurrentAngle(angles[0] || "");
                              setCameraActive(true);
                            }}
                          >
                            Take Photos
                          </button>
                          {selectedProcedure && (
                            <div className="mt-2 small text-muted">
                              Required: {getProcedureAngles(selectedProcedure).join(", ")}
                            </div>
                          )}
                        </>
                      )}
                      {!photoPreview && Object.keys(capturedPhotos).length === 0 && isSubmitClicked && (
                        <div className="text-danger small mt-1">
                          Photos are required.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Captured Photos Gallery */}
                {Object.keys(capturedPhotos).length > 0 && (
                  <div className="mb-3">
                    <label className="form-label">Captured Photos</label>
                    <div className="d-flex flex-wrap gap-2">
                      {Object.entries(capturedPhotos).map(([angle, photo]) => (
                        <div key={angle} className="text-center">
                          <img
                            src={photo}
                            alt={angle}
                            style={{
                              width: 80,
                              height: 80,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "2px solid #ddd",
                            }}
                          />
                          <div className="small mt-1">{angle}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <GenerateElements
                  controlsList={controlsList}
                  selectedItem={selectedItem}
                  onChange={onChange}
                  getListofItemsForDropdown={getDropdownvalues}
                />

                {/* Signature Capture Section for Mobile */}
                {isMobile && (
                  <div className="mb-4">
                    <label className="form-label">Signature (draw below)</label>
                    <div
                      style={{
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        position: "relative",
                        width: "100%",
                        height: 200,
                        touchAction: "none",
                      }}
                    >
                      {!signaturePreview && (
                        <canvas
                          ref={signatureCanvasRef}
                          width={window.innerWidth - 40}
                          height={200}
                          style={{ width: "100%", height: "100%" }}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      )}

                      {signaturePreview && (
                        <img
                          src={signaturePreview}
                          alt="Signature Preview"
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "contain",
                          }}
                        />
                      )}
                    </div>

                    <div className="d-flex gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={clearSignature}
                        hidden={selectedItem.id>0}
                      >
                        Clear
                      </button>
                      {isSubmitClicked && !signaturePreview && (
                        <div className="text-danger small mt-1">
                          Signature is required.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary w-100">
                  Submit
                </button>
              </div>
            </form>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </div>
      </div>

      {!isMobile && <div className="modal-backdrop fade show" />}
    </FormProvider>
  );
};

export default ClientAddEdit;
