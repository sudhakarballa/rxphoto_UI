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
import { SharePointService } from "../services/SharePointService"



const ClientAddEdit = () => {
const sharePointSvc = new SharePointService();
  const header = "Patient Information Form";


  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setShowSignaturePad(true);
    }
  }, [isMobile]);
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
      sidebyItem: "Mobile Number",
    },
    {
      key: "Mobile Number",
      value: "mobileNumber",
      isRequired: true,
      elementSize: 6,
      isSideByItem: true,
    },
    {
      key: "Procedure Name",
      value: "procedureName",
      isRequired: true,
      elementSize: 6,
      sidebyItem: "Date of Birth",
       type: ElementType.dropdown
    },
    {
      key: "Date of Birth",
      value: "dateOfBirth",
      isRequired: true,
      elementSize: 6,
      isSideByItem: true,
      type: ElementType.datepicker
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
  }, [cameraActive, cameraFacing]);

  // Initialize as new form - no existing data to load

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

    // Get final signature
    let finalSignature = signaturePreview;
    if (!finalSignature) {
      const dataUrl = getSignatureDataUrl();
      if (!dataUrl) {
        toast.error("Signature is required.");
        return;
      }
      finalSignature = dataUrl;
    }

    console.log('Submitting form data:', item);


    // Submit to SharePoint
    try {
      const sharePointSuccess = await sharePointSvc.submitPatientForm(
        item,
        capturedPhotos,
        finalSignature || undefined
      );

      if (sharePointSuccess) {
        toast.success("Form submitted successfully!");
        setTimeout(() => {
          if (window.confirm("Form submitted successfully! Would you like to submit another form?")) {
            window.location.reload();
          }
        }, 1000);
      } else {
        toast.error("Failed to submit form. Please try again.");
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Error submitting form. Please check your connection.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle multiple file uploads
      const newPhotos: {[key: string]: string} = {};
      const requiredAnglesForProcedure = getProcedureAngles(selectedProcedure);
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const angleName = requiredAnglesForProcedure[index] || `Photo ${index + 1}`;
          newPhotos[angleName] = reader.result as string;
          
          // Update captured photos
          setCapturedPhotos(prev => ({ ...prev, ...newPhotos }));
          
          // Set first photo as preview
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



  const getDropdownvalues = (item: any) => {
    const procedure=[
      { procedureId: "Brow Lift", procedureName: "Brow Lift" },
      { procedureId: "Body Feminisation", procedureName: "Body Feminisation" },
      { procedureId: "Voice and Throat", procedureName: "Voice and Throat" },
      { procedureId: "Facial Masculinisation", procedureName: "Facial Masculinisation" }
    ]


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

      }
      return;
    }
    if (item.key === "Last Visit") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setValue("lastVisit" as never, date as never);

      }
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
          padding: isMobile ? "10px" : "20px"
        }}
      >
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8 col-xl-6">
              <div 
                className="card shadow-lg border-0" 
                style={{ 
                  borderRadius: "20px",
                  overflow: "hidden",
                  backdropFilter: "blur(10px)",
                  backgroundColor: "rgba(255, 255, 255, 0.95)"
                }}
              >
            <form onSubmit={handleSubmit(onSubmit)}>
              <div 
                className="card-header text-white text-center border-0" 
                style={{ 
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "30px 20px"
                }}
              >
                <div className="mb-2">
                  <i className="bi bi-clipboard-heart" style={{ fontSize: "2.5rem" }}></i>
                </div>
                <h3 className="mb-2 fw-bold">{header}</h3>
                <p className="mb-0 opacity-90">Please fill out all required information</p>
              </div>

              <div className="card-body" style={{ padding: isMobile ? "15px" : "25px" }}>
                {/* Photo Capture Section */}
                <div className="text-center mb-3">
                  <div 
                    className="p-2 rounded-3 mb-2" 
                    style={{ 
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      color: "white"
                    }}
                  >
                    <i className="bi bi-camera-fill mb-1" style={{ fontSize: "1.2rem" }}></i>
                    <h6 className="mb-0">Photo Capture</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center gap-2">
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
                    ) : !isMobile && cameraActive ? (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          maxWidth: "500px",
                          height: "400px",
                          backgroundColor: "black",
                          borderRadius: "20px",
                          overflow: "hidden",
                          margin: "0 auto"
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
                        className="position-relative d-flex justify-content-center align-items-center shadow-sm"
                        style={{
                          width: isMobile ? 80 : 100,
                          height: isMobile ? 80 : 100,
                          borderRadius: "15px",
                          background: photoPreview ? "none" : "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                          backgroundSize: "cover",
                          backgroundImage: photoPreview ? `url(${photoPreview})` : "none",
                          border: "2px solid white",
                        }}
                      >
                        {!photoPreview && (
                          <div className="text-center">
                            <i className="bi bi-camera" style={{ fontSize: "1.8rem", color: "#667eea" }}></i>
                            <div className="small" style={{ color: "#667eea" }}>No Photo</div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      {!isMobile && (
                        <>
                          <div className="d-flex gap-2 flex-wrap justify-content-center">
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                border: "none",
                                color: "white",
                                borderRadius: "8px",
                                padding: "6px 16px",
                                fontSize: "0.85rem"
                              }}
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
                              <i className="bi bi-camera me-1"></i>
                              Take Photos
                            </button>
                            <label
                              htmlFor="photoInput"
                              className="btn btn-sm"
                              style={{
                                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                                border: "none",
                                color: "white",
                                borderRadius: "8px",
                                padding: "6px 16px",
                                fontSize: "0.85rem"
                              }}
                            >
                              <i className="bi bi-upload me-1"></i>
                              Upload Photos
                            </label>
                            <input
                              type="file"
                              id="photoInput"
                              accept="image/*"
                              multiple
                              style={{ display: "none" }}
                              onChange={handleFileChange}
                            />
                          </div>
                          {selectedProcedure && (
                            <div 
                              className="mt-3 p-3 rounded-3" 
                              style={{ 
                                background: "rgba(102, 126, 234, 0.1)",
                                border: "1px solid rgba(102, 126, 234, 0.2)"
                              }}
                            >
                              <div className="small fw-semibold text-primary mb-1">
                                <i className="bi bi-info-circle me-1"></i>
                                Required Angles:
                              </div>
                              <div className="small text-muted">
                                {getProcedureAngles(selectedProcedure).join(", ")}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {isMobile && !cameraActive && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              color: "white",
                              borderRadius: "8px",
                              padding: "6px 16px",
                              fontSize: "0.85rem"
                            }}
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
                            <i className="bi bi-camera me-1"></i>
                            Take Photos
                          </button>
                          {selectedProcedure && (
                            <div 
                              className="mt-3 p-3 rounded-3" 
                              style={{ 
                                background: "rgba(102, 126, 234, 0.1)",
                                border: "1px solid rgba(102, 126, 234, 0.2)"
                              }}
                            >
                              <div className="small fw-semibold text-primary mb-1">
                                <i className="bi bi-info-circle me-1"></i>
                                Required Angles:
                              </div>
                              <div className="small text-muted">
                                {getProcedureAngles(selectedProcedure).join(", ")}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {cameraActive && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary mt-2"
                          onClick={() => setCameraActive(false)}
                        >
                          Cancel Camera
                        </button>
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
                    <div 
                      className="p-2 rounded-3 mb-2" 
                      style={{ 
                        background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                        color: "white"
                      }}
                    >
                      <i className="bi bi-images me-1" style={{ fontSize: "1rem" }}></i>
                      <small>Captured Photos ({Object.keys(capturedPhotos).length})</small>
                    </div>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                      {Object.entries(capturedPhotos).map(([angle, photo]) => (
                        <div key={angle} className="text-center">
                          <div 
                            className="position-relative shadow-sm"
                            style={{
                              borderRadius: "15px",
                              overflow: "hidden",
                              border: "3px solid white"
                            }}
                          >
                            <img
                              src={photo}
                              alt={angle}
                              style={{
                                width: isMobile ? 60 : 70,
                                height: isMobile ? 60 : 70,
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div className="small mt-2 fw-semibold text-primary">{angle}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <GenerateElements
                  controlsList={controlsList}
                  selectedItem={{}}
                  onChange={onChange}
                  getListofItemsForDropdown={getDropdownvalues}
                />

                {/* Signature Section */}
                <div className="mb-3">
                  <div 
                    className="p-2 rounded-3 mb-2" 
                    style={{ 
                      background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                      color: "white"
                    }}
                  >
                    <i className="bi bi-pen me-1" style={{ fontSize: "1rem" }}></i>
                    <small>Digital Signature</small>
                  </div>
                  
                  {signaturePreview ? (
                    <div className="text-center">
                      <div
                        className="shadow-sm d-inline-block"
                        style={{
                          border: "2px solid rgba(102, 126, 234, 0.2)",
                          borderRadius: "15px",
                          background: "white",
                          padding: "10px"
                        }}
                      >
                        <img
                          src={signaturePreview}
                          alt="Signature"
                          style={{
                            maxWidth: "300px",
                            maxHeight: "150px",
                            objectFit: "contain"
                          }}
                        />
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          style={{
                            borderRadius: "10px",
                            padding: "8px 20px",
                            fontWeight: "500"
                          }}
                          onClick={() => {
                            setSignaturePreview(null);
                            clearSignature();
                          }}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Clear Signature
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      {!isMobile && (
                        <div className="d-flex gap-2 flex-wrap justify-content-center mb-2">
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              border: "none",
                              color: "white",
                              borderRadius: "8px",
                              padding: "6px 16px",
                              fontSize: "0.85rem"
                            }}
                            onClick={() => setShowSignaturePad(true)}
                          >
                            <i className="bi bi-pen me-1"></i>
                            Draw
                          </button>
                          <label
                            htmlFor="signatureUpload"
                            className="btn btn-sm"
                            style={{
                              background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                              border: "none",
                              color: "white",
                              borderRadius: "8px",
                              padding: "6px 16px",
                              fontSize: "0.85rem"
                            }}
                          >
                            <i className="bi bi-upload me-1"></i>
                            Upload
                          </label>
                          <input
                            type="file"
                            id="signatureUpload"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleSignatureUpload}
                          />
                        </div>
                      )}
                      
                      {(isMobile || showSignaturePad) && (
                        <div
                          className="shadow-sm"
                          style={{
                            border: "2px solid rgba(102, 126, 234, 0.2)",
                            borderRadius: "15px",
                            position: "relative",
                            width: "100%",
                            height: 120,
                            touchAction: "none",
                            background: "white"
                          }}
                        >
                          <canvas
                            ref={signatureCanvasRef}
                            width={isMobile ? window.innerWidth - 40 : 600}
                            height={120}
                            style={{ width: "100%", height: "100%" }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>
                      )}
                      
                      {(isMobile || showSignaturePad) && (
                        <div className="d-flex gap-2 mt-3 justify-content-center">
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            style={{
                              borderRadius: "10px",
                              padding: "8px 20px",
                              fontWeight: "500"
                            }}
                            onClick={clearSignature}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Clear
                          </button>
                          {!isMobile && (
                            <button
                              type="button"
                              className="btn btn-success"
                              style={{
                                borderRadius: "10px",
                                padding: "8px 20px",
                                fontWeight: "500"
                              }}
                              onClick={() => {
                                const dataUrl = getSignatureDataUrl();
                                if (dataUrl) {
                                  setSignaturePreview(dataUrl);
                                  setShowSignaturePad(false);
                                } else {
                                  toast.error("Please draw your signature first");
                                }
                              }}
                            >
                              <i className="bi bi-check me-1"></i>
                              Save
                            </button>
                          )}
                        </div>
                      )}
                      
                      {isSubmitClicked && !signaturePreview && (
                        <div className="text-danger small mt-2">
                          Signature is required.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card-footer border-0" style={{ padding: isMobile ? "10px" : "15px" }}>
                <button 
                  type="submit" 
                  className="btn w-100"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    color: "white",
                    borderRadius: "10px",
                    padding: "12px 20px",
                    fontSize: "1rem",
                    fontWeight: "600"
                  }}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Submit Form
                </button>
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
