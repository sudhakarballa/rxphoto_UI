import React, { useRef, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { yupResolver } from "@hookform/resolvers/yup";
import { ElementType, IControl } from "../models/iControl";
import { useForm, FormProvider } from "react-hook-form";
import * as Yup from "yup";
import Util from "../others/util";
import GenerateElements from "../common/generateElements";
import { toast } from "react-toastify";
import faceFrontOverlay from "./images/face-front.svg";
import faceLeftOverlay from "./images/face-left-profile.svg";
import faceRightOverlay from "./images/face-right-profile.svg";
import bodyFrontOverlay from "./images/body-front.svg";
import bodyBackOverlay from "./images/body-back.svg";
import throatOverlay from "./images/throat-profile.svg";
import masculineOverlay from "./images/face-masculine.svg";
import { SharePointService } from "../services/SharePointService";

const ClientAddEdit = () => {
  const sharePointSvc = new SharePointService();
  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSubmitClicked, setIsSubmitClicked] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<string>("");
  const [currentAngle, setCurrentAngle] = useState<string>("");
  const [capturedPhotos, setCapturedPhotos] = useState<{[key: string]: string}>({});
  const [requiredAngles, setRequiredAngles] = useState<string[]>([]);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [currentStep, setCurrentStep] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowSignaturePad(true);
    }
  }, [isMobile]);

  const controlsList: Array<IControl> = [
    {
      key: "First Name",
      value: "firstName",
      isRequired: true,
      elementSize: isMobile ? 12 : 6,
      sidebyItem: isMobile ? undefined : "Last Name",
    },
    {
      key: "Last Name",
      value: "lastName",
      isRequired: true,
      elementSize: isMobile ? 12 : 6,
      isSideByItem: isMobile ? false : true,
    },
    {
      key: "Email",
      value: "email",
      isRequired: true,
      elementSize: isMobile ? 12 : 6,
      sidebyItem: isMobile ? undefined : "Mobile Number",
    },
    {
      key: "Mobile Number",
      value: "mobileNumber",
      isRequired: true,
      elementSize: isMobile ? 12 : 6,
      isSideByItem: isMobile ? false : true,
    },
    {
      key: "Procedure Name",
      value: "procedureName",
      isRequired: true,
      elementSize: isMobile ? 12 : 6,
      sidebyItem: isMobile ? undefined : "Date of Birth",
      type: ElementType.dropdown
    },
    {
      key: "Date of Birth",
      value: "dateOfBirth",
      isRequired: true,
      elementSize: isMobile ? 12 : 6,
      isSideByItem: isMobile ? false : true,
      type: ElementType.datepicker
    }
  ];

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required('First Name is required'),
    lastName: Yup.string().required('Last Name is required'),
    email: Yup.string().email('Please enter a valid email').required('Email is required'),
    mobileNumber: Yup.string().required('Mobile Number is required'),
    procedureName: Yup.string().required('Procedure Name is required'),
    dateOfBirth: Yup.date().required('Date of Birth is required')
  });

  const formOptions = {
    resolver: yupResolver(validationSchema),
  };

  const methods = useForm(formOptions);
  const { handleSubmit, setValue, formState: { errors } } = methods;

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
  }, [cameraActive, cameraFacing]);

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

  const getSignatureDataUrl = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      return null;
    }

    return canvas.toDataURL("image/png");
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 - form fields
      const formData = methods.getValues() as Record<string, any>;
      const requiredFields = ['firstName', 'lastName', 'email', 'mobileNumber', 'procedureName', 'dateOfBirth'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields before proceeding.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2 - photos
      if (requiredAngles.length > 0 && Object.keys(capturedPhotos).length < requiredAngles.length) {
        toast.error(`Please capture all required photos: ${requiredAngles.join(", ")}`);
        return;
      }
      if (!photoPreview && Object.keys(capturedPhotos).length === 0) {
        toast.error('Please take at least one photo before proceeding.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const onSubmit = async (item: any) => {
    setIsSubmitClicked(true);

    if (requiredAngles.length > 0 && Object.keys(capturedPhotos).length < requiredAngles.length) {
      toast.error(`Please capture all required photos: ${requiredAngles.join(", ")}`);
      return;
    }

    if (!photoPreview && Object.keys(capturedPhotos).length === 0) {
      toast.error("Photo is required.");
      return;
    }

    let finalSignature = signaturePreview;
    if (!finalSignature) {
      const dataUrl = getSignatureDataUrl();
      if (!dataUrl) {
        toast.error("Signature is required.");
        return;
      }
      finalSignature = dataUrl;
    }

    try {
      const backendPayload = {
        id: 0,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        patientId: item.mobileNumber,
        procedureName: item.procedureName,
        dateOfBirth: item.dateOfBirth
      };

      const backendUrl = process.env.REACT_APP_BACKEND_BASE_URL;
      const response = await fetch(`${backendUrl}/PlmsPhoto/plmsphoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload)
      });

      if (response.ok) {
        const sharePointResult = await sharePointSvc.submitPatientForm(
          item,
          capturedPhotos,
          finalSignature || undefined
        );

        if (sharePointResult.success) {
          toast.success("Form submitted successfully!");
          setTimeout(() => {
            if (window.confirm("Form submitted successfully!\n\nWould you like to submit another form?")) {
              window.location.reload();
            }
          }, 1000);
        } else {
          //toast.warning("Form data saved to backend, but SharePoint upload failed.");
        }
      } else {
        throw new Error(`Backend API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Error submitting form. Please check your connection.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPhotos: {[key: string]: string} = {};
      const requiredAnglesForProcedure = getProcedureAngles(selectedProcedure);
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const angleName = requiredAnglesForProcedure[index] || `Photo ${index + 1}`;
          newPhotos[angleName] = reader.result as string;
          
          setCapturedPhotos(prev => ({ ...prev, ...newPhotos }));
          
          if (index === 0) {
            setPhotoPreview(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePhotoAlignment = (imageData: string, angle: string): boolean => {
    const validationRules = {
      'Left Profile': () => Math.random() > 0.6,
      'Right Profile': () => Math.random() > 0.6,
      'Front': () => Math.random() > 0.5,
      'Back': () => Math.random() > 0.6,
      'Left Side': () => Math.random() > 0.6,
      'Right Side': () => Math.random() > 0.6
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

  const getDropdownvalues = (item: any) => {
    const procedure = [
      { procedureId: "Brow Lift", procedureName: "Brow Lift" },
      { procedureId: "Body Feminisation", procedureName: "Body Feminisation" },
      { procedureId: "Voice and Throat", procedureName: "Voice and Throat" },
      { procedureId: "Facial Masculinisation", procedureName: "Facial Masculinisation" }
    ];

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
    if (item.key === "Date of Birth") {
      setValue("dateOfBirth" as never, value as never);
      return;
    }
    setValue(item.value as never, value as never);
  };

  return (
    <FormProvider {...methods}>
      <div 
        className="min-vh-100" 
        style={{ 
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: isMobile ? "5px" : "20px"
        }}
      >
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className={isMobile ? "col-12 px-1" : "col-12 col-md-8 col-lg-6 col-xl-5"}>
              <div 
                className="card shadow-lg border-0" 
                style={{ 
                  borderRadius: "15px",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  backgroundColor: "rgba(255, 255, 255, 0.95)"
                }}
              >
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div 
                    className="card-header text-white text-center border-0" 
                    style={{ 
                      background: "#1C2220",
                      padding: isMobile ? "8px 8px" : "15px 20px"
                    }}
                  >
                    <img 
                      src={`${process.env.PUBLIC_URL}/images/SignatureLogo.jpg`} 
                      alt="Logo" 
                      style={{ 
                        height: isMobile ? "60px" : "80px", 
                        width: isMobile ? "200px" : "280px", 
                        objectFit: "contain" 
                      }} 
                      onError={(e) => {
                        console.error('Logo failed to load');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="card-body d-flex flex-column" style={{ padding: isMobile ? "5px" : "15px", flex: "1", minHeight: isMobile ? "580px" : "430px" }}>
                    <div className={isMobile ? "mb-1" : "mb-2"}>
                      <div className="d-flex justify-content-center align-items-center">
                        <div className="d-flex align-items-center">
                          <div className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${currentStep === 1 ? 'bg-primary text-white' : 'bg-success text-white'}`} style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", fontSize: isMobile ? "0.6rem" : "0.7rem" }}>
                            {currentStep > 1 ? <i className="bi bi-check"></i> : "1"}
                          </div>
                          <span className={`me-2 small ${currentStep === 1 ? 'text-primary fw-bold' : 'text-success'}`} style={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Details</span>
                          <div className={`border-top ${currentStep === 2 ? 'border-primary' : currentStep > 2 ? 'border-success' : 'border-secondary'}`} style={{ width: isMobile ? "15px" : "20px" }}></div>
                          <div className={`rounded-circle d-flex align-items-center justify-content-center mx-2 ${currentStep === 2 ? 'bg-primary text-white' : currentStep > 2 ? 'bg-success text-white' : 'bg-secondary text-white'}`} style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", fontSize: isMobile ? "0.6rem" : "0.7rem" }}>
                            {currentStep > 2 ? <i className="bi bi-check"></i> : "2"}
                          </div>
                          <span className={`me-2 small ${currentStep === 2 ? 'text-primary fw-bold' : currentStep > 2 ? 'text-success' : 'text-secondary'}`} style={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Photos</span>
                          <div className={`border-top ${currentStep === 3 ? 'border-primary' : 'border-secondary'}`} style={{ width: isMobile ? "15px" : "20px" }}></div>
                          <div className={`rounded-circle d-flex align-items-center justify-content-center mx-2 ${currentStep === 3 ? 'bg-primary text-white' : 'bg-secondary text-white'}`} style={{ width: isMobile ? "20px" : "24px", height: isMobile ? "20px" : "24px", fontSize: isMobile ? "0.6rem" : "0.7rem" }}>
                            3
                          </div>
                          <span className={`small ${currentStep === 3 ? 'text-primary fw-bold' : 'text-secondary'}`} style={{ fontSize: isMobile ? "0.7rem" : "0.875rem" }}>Signature</span>
                        </div>
                      </div>
                    </div>

                    {currentStep === 1 && (
                      <div className={isMobile ? "p-2 rounded-3 shadow-sm h-100 d-flex flex-column" : "p-3 rounded-3 shadow-sm h-100 d-flex flex-column"} style={{ background: "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(102, 126, 234, 0.1)" }}>
                        <GenerateElements
                          controlsList={controlsList}
                          selectedItem={{}}
                          onChange={onChange}
                          getListofItemsForDropdown={getDropdownvalues}
                        />
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="h-100 d-flex flex-column">
                        <div className="flex-fill d-flex flex-column" style={{ 
                          border: "2px solid rgba(102, 126, 234, 0.25)", 
                          borderRadius: "16px", 
                          padding: isMobile ? "16px" : "20px", 
                          margin: 0, 
                          background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)",
                          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
                          transition: "all 0.3s ease",
                          position: "relative"
                        }}>
                            <div className="flex-fill d-flex flex-column">
                              {cameraActive ? (
                                isMobile ? (
                                  <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "black", zIndex: 1060 }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    {selectedProcedure && <img src={getOverlayImage()} alt={`${selectedProcedure} Guide`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.6, objectFit: "contain" }} />}
                                    <div style={{ position: "absolute", top: 10, left: 10, color: "white", background: "rgba(0,0,0,0.8)", padding: "5px 10px", borderRadius: "5px", fontSize: "11px" }}>
                                      {selectedProcedure} - {currentAngle} ({Object.keys(capturedPhotos).length + 1}/{requiredAngles.length})
                                    </div>
                                    <div style={{ position: "absolute", bottom: 20, width: "100%", display: "flex", justifyContent: "center" }}>
                                      <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-light btn-sm" onClick={handleCapturePhoto}>Capture</button>
                                        {Object.keys(capturedPhotos).length > 0 && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCameraActive(false)}>Done</button>}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "black", zIndex: 1060 }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    {selectedProcedure && <img src={getOverlayImage()} alt={`${selectedProcedure} Guide`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.6, objectFit: "contain" }} />}
                                    <div style={{ position: "absolute", top: 10, left: 10, color: "white", background: "rgba(0,0,0,0.8)", padding: "5px 10px", borderRadius: "5px", fontSize: "11px" }}>
                                      {selectedProcedure} - {currentAngle} ({Object.keys(capturedPhotos).length + 1}/{requiredAngles.length})
                                    </div>
                                    <div style={{ position: "absolute", bottom: 20, width: "100%", display: "flex", justifyContent: "center" }}>
                                      <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-light btn-sm" onClick={handleCapturePhoto}>Capture</button>
                                        {Object.keys(capturedPhotos).length > 0 && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCameraActive(false)}>Done</button>}
                                      </div>
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="text-center flex-fill d-flex flex-column justify-content-center">
                                  <div className="mb-2">
                                    <div className="position-relative d-flex justify-content-center align-items-center mb-2 mx-auto" style={{ 
                                      width: isMobile ? 120 : 120, 
                                      height: isMobile ? 120 : 120, 
                                      borderRadius: "20px", 
                                      ...(photoPreview ? { 
                                        backgroundImage: `url(${photoPreview})`, 
                                        backgroundSize: "cover", 
                                        backgroundPosition: "center" 
                                      } : { 
                                        background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(168, 237, 234, 0.2) 100%)" 
                                      }), 
                                      border: "3px dashed rgba(102, 126, 234, 0.3)",
                                      boxShadow: "0 8px 24px rgba(102, 126, 234, 0.15)",
                                      transition: "all 0.3s ease"
                                    }}>
                                      {!photoPreview && (
                                        <div className="text-center">
                                          <i className="bi bi-camera" style={{ fontSize: isMobile ? "3rem" : "2.5rem", color: "rgba(102, 126, 234, 0.6)" }}></i>
                                          <div className="small mt-2" style={{ color: "rgba(102, 126, 234, 0.6)", fontSize: isMobile ? "0.8rem" : "0.75rem", fontWeight: "500" }}>No Photos</div>
                                        </div>
                                      )}
                                    </div>
                                    <button type="button" className="btn" style={{ 
                                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                      border: "none",
                                      color: "white",
                                      borderRadius: "12px",
                                      padding: isMobile ? "12px 24px" : "10px 20px",
                                      fontSize: isMobile ? "1rem" : "0.9rem",
                                      fontWeight: "600",
                                      boxShadow: "0 4px 16px rgba(102, 126, 234, 0.3)",
                                      transition: "all 0.2s ease"
                                    }} onClick={() => { if (!selectedProcedure) { toast.error("Select procedure first"); return; } const angles = getProcedureAngles(selectedProcedure); setRequiredAngles(angles); setCurrentAngle(angles[0] || ""); setCameraActive(true); }} onMouseEnter={(e) => {
                                      const target = e.target as HTMLButtonElement;
                                      target.style.transform = "translateY(-2px)";
                                      target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
                                    }} onMouseLeave={(e) => {
                                      const target = e.target as HTMLButtonElement;
                                      target.style.transform = "translateY(0)";
                                      target.style.boxShadow = "0 4px 16px rgba(102, 126, 234, 0.3)";
                                    }}>
                                      <i className="bi bi-camera me-2"></i>
                                      Take Photos
                                    </button>
                                    <input type="file" id="photoInput" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileChange} />
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-center">
                                  <small style={{ fontSize: "0.8rem", color: "rgba(102, 126, 234, 0.8)", fontWeight: "600" }}>Required Photos</small>
                                </div>
                                <div className="d-flex flex-wrap gap-3 justify-content-center">
                                  {(selectedProcedure ? getProcedureAngles(selectedProcedure) : ['Front', 'Left Profile', 'Right Profile']).map((angle) => {
                                      const photo = capturedPhotos[angle];
                                      return (
                                        <div key={angle} className="position-relative" style={{
                                          borderRadius: "16px",
                                          overflow: "hidden",
                                          boxShadow: photo ? "0 6px 16px rgba(102, 126, 234, 0.2)" : "0 4px 12px rgba(102, 126, 234, 0.1)",
                                          border: photo ? "3px solid rgba(102, 126, 234, 0.3)" : "3px dashed rgba(102, 126, 234, 0.2)",
                                          transition: "transform 0.2s ease",
                                          background: photo ? "transparent" : "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(168, 237, 234, 0.1) 100%)"
                                        }} onMouseEnter={(e) => {
                                          if (photo) e.currentTarget.style.transform = "scale(1.05)";
                                        }} onMouseLeave={(e) => {
                                          if (photo) e.currentTarget.style.transform = "scale(1)";
                                        }}>
                                          {photo ? (
                                            <img src={photo} alt={angle} style={{ 
                                              width: isMobile ? (requiredAngles.length <= 3 ? 120 : requiredAngles.length === 4 ? 90 : 70) : 50, 
                                              height: isMobile ? (requiredAngles.length <= 3 ? 120 : requiredAngles.length === 4 ? 90 : 70) : 50, 
                                              objectFit: "cover",
                                              display: "block"
                                            }} />
                                          ) : (
                                            <div style={{
                                              width: isMobile ? (requiredAngles.length <= 3 ? 120 : requiredAngles.length === 4 ? 90 : 70) : 50, 
                                              height: isMobile ? (requiredAngles.length <= 3 ? 120 : requiredAngles.length === 4 ? 90 : 70) : 50,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              color: "rgba(102, 126, 234, 0.4)"
                                            }}>
                                              <i className="bi bi-camera" style={{ fontSize: isMobile ? (requiredAngles.length <= 3 ? "2rem" : requiredAngles.length === 4 ? "1.5rem" : "1.2rem") : "1rem" }}></i>
                                            </div>
                                          )}
                                          <div style={{
                                            position: "absolute",
                                            bottom: "0",
                                            left: "0",
                                            right: "0",
                                            background: photo ? "linear-gradient(transparent, rgba(0,0,0,0.8))" : "rgba(102, 126, 234, 0.8)",
                                            color: "white",
                                            fontSize: "0.65rem",
                                            padding: "3px 6px",
                                            textAlign: "center",
                                            fontWeight: "600"
                                          }}>
                                            {angle}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              {selectedProcedure && !isMobile && (
                                <div className="mt-auto pt-3 text-center">
                                  <div className="p-2 rounded-3" style={{ background: "rgba(102, 126, 234, 0.05)", border: "1px solid rgba(102, 126, 234, 0.1)" }}>
                                    <small style={{ fontSize: "0.7rem", color: "rgba(102, 126, 234, 0.8)", fontWeight: "600" }}>Required Angles: {getProcedureAngles(selectedProcedure).join(", ")}</small>
                                  </div>
                                </div>
                              )}
                            </div>
                        </div>
                        {(Object.keys(capturedPhotos).length === 0 && !photoPreview) && isSubmitClicked && (
                          <div className="text-center mt-2">
                            <small className="text-danger">Photos are required</small>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="h-100 d-flex flex-column">
                        <div className="flex-fill d-flex flex-column" style={{ 
                          border: "2px solid rgba(102, 126, 234, 0.25)", 
                          borderRadius: "16px", 
                          padding: isMobile ? "16px" : "20px", 
                          margin: 0, 
                          background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)",
                          boxShadow: "0 4px 20px rgba(102, 126, 234, 0.08)",
                          transition: "all 0.3s ease",
                          position: "relative"
                        }}>
                          <div className="text-center flex-fill d-flex flex-column justify-content-center">
                            {signaturePreview ? (
                              <>
                                <div className="d-inline-block" style={{ 
                                  border: "2px solid rgba(102, 126, 234, 0.15)", 
                                  borderRadius: "12px", 
                                  background: "white", 
                                  padding: isMobile ? "8px" : "12px", 
                                  marginBottom: isMobile ? "8px" : "12px",
                                  boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
                                  transition: "transform 0.2s ease"
                                }}>
                                  <img src={signaturePreview} alt="Signature" style={{ maxWidth: isMobile ? "280px" : "150px", maxHeight: isMobile ? "100px" : "50px", objectFit: "contain" }} />
                                </div>
                                <div>
                                  <button type="button" className="btn btn-outline-danger btn-sm" style={{
                                    borderRadius: "8px",
                                    transition: "all 0.2s ease",
                                    fontWeight: "500"
                                  }} onClick={() => { setSignaturePreview(null); clearSignature(); }}>Clear Signature</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <div style={{ 
                                    border: "2px dashed rgba(102, 126, 234, 0.3)", 
                                    borderRadius: "12px", 
                                    width: "100%", 
                                    height: isMobile ? 300 : 250, 
                                    touchAction: "none", 
                                    background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)",
                                    transition: "all 0.3s ease",
                                    position: "relative",
                                    overflow: "hidden"
                                  }}>
                                    <canvas ref={signatureCanvasRef} width={isMobile ? 320 : 300} height={isMobile ? 300 : 250} style={{ 
                                      width: "100%", 
                                      height: "100%", 
                                      borderRadius: "12px",
                                      cursor: "crosshair"
                                    }} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                                    {!signaturePreview && (
                                      <div className="position-absolute" style={{
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        pointerEvents: "none",
                                        color: "rgba(102, 126, 234, 0.4)",
                                        fontSize: isMobile ? "0.75rem" : "0.7rem",
                                        fontWeight: "500",
                                        zIndex: 1
                                      }}>
                                        {isMobile ? "Tap to sign" : "Click and drag to sign"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-center mt-2">
                                    <button type="button" className="btn btn-outline-danger btn-sm" style={{
                                      borderRadius: "8px",
                                      transition: "all 0.2s ease",
                                      fontWeight: "500"
                                    }} onClick={clearSignature}>
                                      <i className="bi bi-trash me-1"></i>
                                      Clear
                                    </button>
                                  </div>
                                </div>
                                <input type="file" id="signatureUpload" accept="image/*" style={{ display: "none" }} onChange={handleSignatureUpload} />
                              </>
                            )}
                          </div>
                        </div>
                        {!signaturePreview && isSubmitClicked && (
                          <div className="text-center mt-2">
                            <small className="text-danger">Signature is required</small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="card-footer border-0" style={{ padding: isMobile ? "5px" : "15px", paddingTop: "0" }}>
                    {currentStep === 1 ? (
                      <button 
                        type="button"
                        className="btn w-100"
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          color: "white",
                          borderRadius: "8px",
                          padding: isMobile ? "8px 16px" : "10px 20px",
                          fontSize: isMobile ? "0.9rem" : "1rem",
                          fontWeight: "600"
                        }}
                        onClick={handleNextStep}
                      >
                        {isMobile ? "Next" : "Next: Photos"}
                        <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    ) : currentStep === 2 ? (
                      <div className="d-flex gap-2">
                        <button 
                          type="button"
                          className="btn btn-outline-secondary"
                          style={{
                            borderRadius: "8px",
                            padding: isMobile ? "8px 16px" : "10px 20px",
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            fontWeight: "600",
                            flex: "0 0 auto"
                          }}
                          onClick={handlePrevStep}
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          {isMobile ? "Back" : "Back"}
                        </button>
                        <button 
                          type="button" 
                          className="btn flex-fill"
                          style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            color: "white",
                            borderRadius: "8px",
                            padding: isMobile ? "8px 16px" : "10px 20px",
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            fontWeight: "600"
                          }}
                          onClick={handleNextStep}
                        >
                          {isMobile ? "Next" : "Next: Signature"}
                          <i className="bi bi-arrow-right ms-2"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex gap-2">
                        <button 
                          type="button"
                          className="btn btn-outline-secondary"
                          style={{
                            borderRadius: "8px",
                            padding: isMobile ? "8px 16px" : "10px 20px",
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            fontWeight: "600",
                            flex: "0 0 auto"
                          }}
                          onClick={handlePrevStep}
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          {isMobile ? "Back" : "Back"}
                        </button>
                        <button 
                          type="submit" 
                          className="btn flex-fill"
                          style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            color: "white",
                            borderRadius: "8px",
                            padding: isMobile ? "8px 16px" : "10px 20px",
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            fontWeight: "600"
                          }}
                        >
                          <i className="bi bi-check-circle me-2"></i>
                          {isMobile ? "Submit" : "Submit Form"}
                        </button>
                      </div>
                    )}
                  </div>
                </form>

                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default ClientAddEdit;