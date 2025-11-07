import { yupResolver } from "@hookform/resolvers/yup";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as Yup from "yup";
import GenerateElements from "../common/generateElements";
import { ElementType, IControl } from "../models/iControl";
import { SharePointService } from "../services/SharePointService";
// import faceFrontOverlay from "./images/face-front.svg";
import faceLeftOverlay from "./images/face-left-profile.svg";
import faceRightOverlay from "./images/face-right-profile.svg";
import bodyFrontOverlay from "./images/body-front.svg";
import bodyBackOverlay from "./images/body-back.svg";
import throatOverlay from "./images/throat-profile.svg";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState<string>("");

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
  const { handleSubmit, setValue, trigger, formState: { errors } } = methods;

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

  const handleNextStep = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep === 1) {
      // Trigger validation for all fields
      const isValid = await trigger();
      if (!isValid) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2 - photos
      if (requiredAngles.length > 0 && Object.keys(capturedPhotos).length < requiredAngles.length) {
        setPhotoError(`Please capture all required photos: ${requiredAngles.join(", ")}`);
        return;
      }
      if (!photoPreview && Object.keys(capturedPhotos).length === 0) {
        setPhotoError('Please take at least one photo before proceeding.');
        return;
      }
      setPhotoError("");
      setCurrentStep(3);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCurrentStep(1);
  };

  const onSubmit = async (item: any) => {
    // Prevent submission if not on step 3

    if (currentStep !== 3) {
      return;
    }
    
    setIsSubmitClicked(true);

    if (requiredAngles.length > 0 && Object.keys(capturedPhotos).length < requiredAngles.length) {
      setPhotoError(`Please capture all required photos: ${requiredAngles.join(", ")}`);
      return;
    }

    if (!photoPreview && Object.keys(capturedPhotos).length === 0) {
      setPhotoError("Photo is required.");
      return;
    }

    setIsSubmitting(true);

    let finalSignature = signaturePreview;
    if (!finalSignature) {
      const dataUrl = getSignatureDataUrl();
      finalSignature = dataUrl; // Signature is optional
    }

    try {
      const photos = Object.entries(capturedPhotos).map(([angle, dataUrl]) => ({
        angle,
        imageData: dataUrl
      }));
      
      const backendPayload = {
        id: 0,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        patientId: item.mobileNumber,
        procedureName: item.procedureName,
        dateOfBirth: item.dateOfBirth,
        photos: photos,
        signature: finalSignature
      };
      
      // Submit to backend API only (SharePoint integration moved to backend)
      const backendUrl = process.env.REACT_APP_BACKEND_BASE_URL;
      const response = await fetch(`${backendUrl}/PlmsPhoto/plmsphoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload)
      });

      if (response.ok) {
        toast.success("🎉 Your form has been submitted successfully!");
        setTimeout(() => {
          // Reset form and redirect to first step
          methods.reset();
          setCurrentStep(1);
          setCapturedPhotos({});
          setPhotoPreview(null);
          setSignaturePreview(null);
          setSelectedProcedure("");
          setRequiredAngles([]);
          setCurrentAngle("");
          clearSignature();
          setIsSubmitting(false);
          setIsSubmitClicked(false);
        }, 2000);
      } else {
        throw new Error(`Backend API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Error submitting form. Please check your connection.");
      setIsSubmitting(false);
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

  const validatePoseStructure = (data: Uint8ClampedArray, width: number, height: number, angle: string): boolean => {
    // Detect skin tone regions (assuming person is in center)
    const skinRegions = detectSkinRegions(data, width, height);
    if (skinRegions.length < 100) return false; // Not enough skin detected
    
    // Analyze pose based on angle requirements
    if (angle.includes('Anterior') || angle.includes('Front')) {
      return validateFrontalPose(data, width, height, skinRegions);
    } else if (angle.includes('Posterior') || angle.includes('Back')) {
      return validateBackPose(data, width, height, skinRegions);
    } else if (angle.includes('Left') || angle.includes('left')) {
      return validateLeftPose(data, width, height, skinRegions);
    } else if (angle.includes('Right') || angle.includes('right')) {
      return validateRightPose(data, width, height, skinRegions);
    } else if (angle.includes('Lateral')) {
      return validateLateralPose(data, width, height, skinRegions, angle);
    }
    
    return true; // Default validation for other angles
  };

  const detectSkinRegions = (data: Uint8ClampedArray, width: number, height: number): Array<{x: number, y: number}> => {
    const skinPixels: Array<{x: number, y: number}> = [];
    
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skin tone detection (simplified)
        if (isSkinTone(r, g, b)) {
          skinPixels.push({x, y});
        }
      }
    }
    
    return skinPixels;
  };

  const isSkinTone = (r: number, g: number, b: number): boolean => {
    // Simplified skin tone detection
    return (r > 95 && g > 40 && b > 20 && 
            Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
            Math.abs(r - g) > 15 && r > g && r > b);
  };

  const validateFrontalPose = (data: Uint8ClampedArray, width: number, height: number, skinRegions: Array<{x: number, y: number}>): boolean => {
    // Check for symmetrical distribution of skin regions
    const leftSide = skinRegions.filter(p => p.x < width / 2).length;
    const rightSide = skinRegions.filter(p => p.x > width / 2).length;
    const symmetryRatio = Math.min(leftSide, rightSide) / Math.max(leftSide, rightSide);
    
    return symmetryRatio > 0.6; // At least 60% symmetry for frontal pose
  };

  const validateBackPose = (data: Uint8ClampedArray, width: number, height: number, skinRegions: Array<{x: number, y: number}>): boolean => {
    // Similar to frontal but check for back-specific features
    const centerRegions = skinRegions.filter(p => p.x > width * 0.3 && p.x < width * 0.7).length;
    const totalRegions = skinRegions.length;
    
    return centerRegions / totalRegions > 0.4; // Back should have concentrated center mass
  };

  const validateLeftPose = (data: Uint8ClampedArray, width: number, height: number, skinRegions: Array<{x: number, y: number}>): boolean => {
    // Left profile should have more skin on the right side of image
    const leftSide = skinRegions.filter(p => p.x < width * 0.4).length;
    const rightSide = skinRegions.filter(p => p.x > width * 0.6).length;
    
    return rightSide > leftSide * 1.5; // Right side should dominate for left profile
  };

  const validateRightPose = (data: Uint8ClampedArray, width: number, height: number, skinRegions: Array<{x: number, y: number}>): boolean => {
    // Right profile should have more skin on the left side of image
    const leftSide = skinRegions.filter(p => p.x < width * 0.4).length;
    const rightSide = skinRegions.filter(p => p.x > width * 0.6).length;
    
    return leftSide > rightSide * 1.5; // Left side should dominate for right profile
  };

  const validateLateralPose = (data: Uint8ClampedArray, width: number, height: number, skinRegions: Array<{x: number, y: number}>, angle: string): boolean => {
    if (angle.includes('Left')) {
      return validateLeftPose(data, width, height, skinRegions);
    } else {
      return validateRightPose(data, width, height, skinRegions);
    }
  };

  const validatePhotoAlignment = (imageData: string, angle: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for analysis
        const imageDataArray = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataArray.data;
        
        // Basic quality checks
        let totalBrightness = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }
        
        const avgBrightness = totalBrightness / pixelCount;
        
        // Reject if image is too dark
        if (avgBrightness < 30) {
          resolve(false);
          return;
        }
        
        // Reject if image is too bright
        if (avgBrightness > 240) {
          resolve(false);
          return;
        }
        
        // Analyze image for pose/angle validation
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const sampleSize = 20;
        
        // Sample pixels from different regions to detect pose
        let leftSideBrightness = 0;
        let rightSideBrightness = 0;
        let topBrightness = 0;
        let bottomBrightness = 0;
        
        // Sample left side
        for (let i = 0; i < sampleSize; i++) {
          const x = Math.floor(canvas.width * 0.2);
          const y = Math.floor((canvas.height / sampleSize) * i);
          const pixelIndex = (y * canvas.width + x) * 4;
          leftSideBrightness += (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
        }
        
        // Sample right side
        for (let i = 0; i < sampleSize; i++) {
          const x = Math.floor(canvas.width * 0.8);
          const y = Math.floor((canvas.height / sampleSize) * i);
          const pixelIndex = (y * canvas.width + x) * 4;
          rightSideBrightness += (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
        }
        
        leftSideBrightness /= sampleSize;
        rightSideBrightness /= sampleSize;
        
        const brightnessDiff = Math.abs(leftSideBrightness - rightSideBrightness);
        
        // Advanced pose validation based on angle
        const isValidPose = validatePoseStructure(data, canvas.width, canvas.height, angle);
        resolve(isValidPose);
      };
      
      img.onerror = () => resolve(false);
      img.src = imageData;
    });
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !currentAngle) return;
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, width, height);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    
    const isValid = await validatePhotoAlignment(dataUrl, currentAngle);
    if (!isValid) {
      const getErrorMessage = (angle: string) => {
        if (angle.includes('Left') || angle.includes('left')) {
          return `Please position yourself to show the LEFT side as required for ${angle}. The image doesn't match the expected left angle.`;
        } else if (angle.includes('Right') || angle.includes('right')) {
          return `Please position yourself to show the RIGHT side as required for ${angle}. The image doesn't match the expected right angle.`;
        } else if (angle.includes('Anterior') || angle.includes('Front')) {
          return `Please face the camera directly for ${angle}. The image doesn't show the front view properly.`;
        } else if (angle.includes('Posterior') || angle.includes('Back')) {
          return `Please turn around to show your back for ${angle}. The image doesn't show the back view properly.`;
        } else {
          return `The captured image doesn't match the required ${angle} position. Please adjust your pose and try again.`;
        }
      };
      
      const message = getErrorMessage(currentAngle);
      setPhotoError(message);
      return;
    }
    
    setCapturedPhotos(prev => ({ ...prev, [currentAngle]: dataUrl }));
    setPhotoError("");
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
    // Only show procedures that have overlay images available
    const procedure = [
      { procedureId: "Abdominoplasty-Mini Abdominoplasty", procedureName: "Abdominoplasty-Mini Abdominoplasty" },
      { procedureId: "Arms Lift", procedureName: "Arms Lift" },
      { procedureId: "Buccal Fat pad Removal", procedureName: "Buccal Fat pad Removal" },
      { procedureId: "Buffalo Hump ( Female )", procedureName: "Buffalo Hump ( Female )" },
      { procedureId: "Buffalo Hump ( Male )", procedureName: "Buffalo Hump ( Male )" },
      { procedureId: "Carpal Tunnel", procedureName: "Carpal Tunnel" },
      { procedureId: "Dimpleplasty", procedureName: "Dimpleplasty" },
      { procedureId: "Earlobe Reduction-Earlobe repair", procedureName: "Earlobe Reduction-Earlobe repair" },
      { procedureId: "Face Lift", procedureName: "Face Lift" },
      { procedureId: "Forehead Reduction", procedureName: "Forehead Reduction" },
      { procedureId: "Gynecomastia", procedureName: "Gynecomastia" },
      { procedureId: "Inverted Nipple-Nipple Reduction (Female)", procedureName: "Inverted Nipple-Nipple Reduction (Female)" },
      { procedureId: "Inverted Nipple-Nipple Reduction (Male)", procedureName: "Inverted Nipple-Nipple Reduction (Male)" },
      { procedureId: "Labiaplasty", procedureName: "Labiaplasty" },
      { procedureId: "Lip Lift", procedureName: "Lip Lift" },
      { procedureId: "Lower Blepharoplasty", procedureName: "Lower Blepharoplasty" },
      { procedureId: "Neck Lift", procedureName: "Neck Lift" },
      { procedureId: "Otoplasty", procedureName: "Otoplasty" },
      { procedureId: "Penile girth Enhancement-Ligament Release", procedureName: "Penile girth Enhancement-Ligament Release" },
      { procedureId: "Skin tag removal-Mole removal-Cyst Removal", procedureName: "Skin tag removal-Mole removal-Cyst Removal" },
      { procedureId: "Trigger finger", procedureName: "Trigger finger" },
      { procedureId: "Upper Blepharoplasty-Ptosis Repair", procedureName: "Upper Blepharoplasty-Ptosis Repair" }
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
      case "Abdominoplasty-Mini Abdominoplasty":
        return ["Anterior Oblique Left", "Anterior Oblique Right", "Lateral Left", "Lateral Right", "Posterior Oblique Left", "Posterior Oblique Right"];
      case "Arms Lift":
        return ["Armpits Anterior", "Arms Anterior Bent Down Left", "Arms Anterior Bent Down Right", "Arms Anterior Level Left", "Arms Anterior Level Right"];
      case "Brow Lift":
        return ["Front", "Left Profile", "Right Profile"];
      case "Buccal Fat pad Removal":
        return ["Closed Mouth Anterior", "Open Mouth Anterior Oblique Left", "Open Mouth Anterior Oblique Right"];
      case "Buffalo Hump ( Female )":
        return ["Upper Body Lateral Left", "Upper Body Lateral Right"];
      case "Buffalo Hump ( Male )":
        return ["Trunk Posterior", "Trunk Lateral Left", "Trunk Lateral Right"];
      case "Carpal Tunnel":
        return ["Fist Anterior Left", "Fist Anterior Right", "Hand Anterior Left", "Hand Anterior Right"];
      case "Dimpleplasty":
        return ["Closed Mouth Anterior Oblique Left", "Closed Mouth Anterior Oblique Right", "Closed Mouth Anterior", "Smile"];
      case "Earlobe Reduction-Earlobe repair":
        return ["Full Crown Lateral Left", "Full Crown Lateral Right"];
      case "Face Lift":
        return ["Face Chin Down", "Face Frontal", "Face Lateral Right"];
      case "Forehead Reduction":
        return ["1-2 Crown Anterior", "Full Crown Lateral Left", "Full Crown Lateral Right"];
      case "Gynecomastia":
        return ["Trunk Anterior Oblique Left", "Trunk Anterior Oblique Right", "Trunk Anterior", "Trunk Lateral Left", "Trunk Lateral Right"];
      case "Inverted Nipple-Nipple Reduction (Female)":
        return ["Left Side", "Right Side", "Upper Body Anterior"];
      case "Inverted Nipple-Nipple Reduction (Male)":
        return ["Left Side", "Right Side", "Trunk Anterior"];
      case "Labiaplasty":
        return ["Female"];
      case "Lip Lift":
        return ["Lips Anterior", "Lips Lateral Left", "Lips Lateral Right"];
      case "Lower Blepharoplasty":
        return ["Face Frontal Distance", "Face Lateral Left Distance", "Face Lateral Right Distance", "Face Near"];
      case "Neck Lift":
        return ["Neck Portrait Anterior", "Neck Portrait Lateral Left", "Neck Portrait Lateral Right"];
      case "Otoplasty":
        return ["Face Frontal Distance", "Full Crown Lateral Left", "Full Crown Lateral Right", "Full Crown Posterior"];
      case "Penile girth Enhancement-Ligament Release":
        return ["Male"];
      case "Skin tag removal-Mole removal-Cyst Removal":
        return ["3x3 Grid", "4x4 Grid"];
      case "Trigger finger":
        return ["Fist Anterior Left", "Fist Anterior Right", "Hand Anterior Left", "Hand Anterior Right"];
      case "Upper Blepharoplasty-Ptosis Repair":
        return ["Face Frontal Distance", "Face Lateral Left Distance", "Face Lateral Right Distance", "Face Near"];
      default:
        return ["Front"];
    }
  };

  const getOverlayImage = () => {
    if (!selectedProcedure || !currentAngle) return null;
    
    const getImageFileName = (procedure: string, angle: string): string => {
      const angleMap: { [key: string]: { [key: string]: string } } = {
        "Abdominoplasty-Mini Abdominoplasty": {
          "Anterior Oblique Left": "Abdomen-Anterior - Oblique Left.svg",
          "Anterior Oblique Right": "Abdomen-Anterior - Oblique Right.svg",
          "Lateral Left": "Abdomen-Lateral Left.svg",
          "Lateral Right": "Abdomen-Lateral Right.svg",
          "Posterior Oblique Left": "Abdomen-Posterior - Oblique Left.svg",
          "Posterior Oblique Right": "Abdomen-Posterior - Oblique Right.svg"
        },
        "Arms Lift": {
          "Armpits Anterior": "Armpits-Anterior.svg",
          "Arms Anterior Bent Down Left": "Arms-Anterior - Bent Down Left.svg",
          "Arms Anterior Bent Down Right": "Arms-Anterior - Bent Down Right.svg",
          "Arms Anterior Level Left": "Arms-Anterior - Level Left.svg",
          "Arms Anterior Level Right": "Arms-Anterior - Level Right.svg"
        },
        "Buccal Fat pad Removal": {
          "Closed Mouth Anterior": "Closed Mouth-Anterior.svg",
          "Open Mouth Anterior Oblique Left": "Open Mouth-Anterior - Oblique Left.svg",
          "Open Mouth Anterior Oblique Right": "Open Mouth-Anterior - Oblique Right.svg"
        },
        "Buffalo Hump ( Female )": {
          "Upper Body Lateral Left": "Upper Body-Lateral - Left.svg",
          "Upper Body Lateral Right": "Upper Body-Lateral - Right.svg"
        },
        "Buffalo Hump ( Male )": {
          "Trunk Posterior": "Tram-Posterior.svg",
          "Trunk Lateral Left": "Trunk-Lateral-Left.svg",
          "Trunk Lateral Right": "Trunk-Lateral-Right.svg"
        },
        "Carpal Tunnel": {
          "Fist Anterior Left": "Fist-Anterior - Left.svg",
          "Fist Anterior Right": "Fist-Anterior - Right.svg",
          "Hand Anterior Left": "Hand-Anterior - Left.svg",
          "Hand Anterior Right": "Hand-Anterior - Right.svg"
        },
        "Dimpleplasty": {
          "Closed Mouth Anterior Oblique Left": "Closed Mouth-Anterior - Oblique Left.svg",
          "Closed Mouth Anterior Oblique Right": "Closed Mouth-Anterior - Oblique Right.svg",
          "Closed Mouth Anterior": "Closed Mouth-Anterior.svg",
          "Smile": "Smile.svg"
        },
        "Face Lift": {
          "Face Chin Down": "Face-Chin Down.svg",
          "Face Frontal": "Face-Frontal.svg",
          "Face Lateral Right": "Face-Lateral Right.svg"
        },
        "Gynecomastia": {
          "Trunk Anterior Oblique Left": "Trunk-Anterior - Oblique Left.svg",
          "Trunk Anterior Oblique Right": "Trunk-Anterior - Oblique Right.svg",
          "Trunk Anterior": "Trunk-Anterior.svg",
          "Trunk Lateral Left": "Trunk-Lateral Left.svg",
          "Trunk Lateral Right": "Trunk-Lateral Right.svg"
        },
        "Earlobe Reduction-Earlobe repair": {
          "Full Crown Lateral Left": "Full Crown-Lateral Left.svg",
          "Full Crown Lateral Right": "Full Crown-Lateral Right.svg"
        },
        "Forehead Reduction": {
          "1-2 Crown Anterior": "1-2 Crown-Anterior.svg",
          "Full Crown Lateral Left": "Full Crown-Lateral Left.svg",
          "Full Crown Lateral Right": "Full Crown-Lateral Right.svg"
        },
        "Inverted Nipple-Nipple Reduction (Female)": {
          "Left Side": "Left-Side.svg",
          "Right Side": "Right-Side.svg",
          "Upper Body Anterior": "Upper Body-Anterior.svg"
        },
        "Inverted Nipple-Nipple Reduction (Male)": {
          "Left Side": "Left-Side.svg",
          "Right Side": "Right-Side.svg",
          "Trunk Anterior": "Trunk-Anterior.svg"
        },
        "Labiaplasty": {
          "Female": "Female.svg"
        },
        "Lip Lift": {
          "Lips Anterior": "Lips-Anterior.svg",
          "Lips Lateral Left": "Lips-Lateral - Left.svg",
          "Lips Lateral Right": "Lips-Lateral - Right.svg"
        },
        "Lower Blepharoplasty": {
          "Face Frontal Distance": "Face-Frontal - Distance.svg",
          "Face Lateral Left Distance": "Face-Lateral Left - Distance.svg",
          "Face Lateral Right Distance": "Face-Lateral Right - Distance.svg",
          "Face Near": "Face-Near.svg"
        },
        "Neck Lift": {
          "Neck Portrait Anterior": "Neck (Portrait)-Anterior.svg",
          "Neck Portrait Lateral Left": "Neck (Portrait)-Lateral - Left.svg",
          "Neck Portrait Lateral Right": "Neck (Portrait)-Lateral - Right.svg"
        },
        "Otoplasty": {
          "Face Frontal Distance": "Face-Frontal - Distance.svg",
          "Full Crown Lateral Left": "Full Crown-Lateral Left.svg",
          "Full Crown Lateral Right": "Full Crown-Lateral Right.svg",
          "Full Crown Posterior": "Full Crown-Posterior.svg"
        },
        "Penile girth Enhancement-Ligament Release": {
          "Male": "Male.svg"
        },
        "Skin tag removal-Mole removal-Cyst Removal": {
          "3x3 Grid": "3x3 Grid.svg",
          "4x4 Grid": "4x4 Grid.svg"
        },
        "Trigger finger": {
          "Fist Anterior Left": "Fist-Anterior - Left.svg",
          "Fist Anterior Right": "Fist-Anterior - Right.svg",
          "Hand Anterior Left": "Hand-Anterior - Left.svg",
          "Hand Anterior Right": "Hand-Anterior - Right.svg"
        },
        "Upper Blepharoplasty-Ptosis Repair": {
          "Face Frontal Distance": "Face-Frontal - Distance.svg",
          "Face Lateral Left Distance": "Face-Lateral Left - Distance.svg",
          "Face Lateral Right Distance": "Face-Lateral Right - Distance.svg",
          "Face Near": "Face-Near.svg"
        }
      };
      
      return angleMap[procedure]?.[angle] || "";
    };
    
    const fileName = getImageFileName(selectedProcedure, currentAngle);
    if (fileName) {
      try {
        return require(`./images/${selectedProcedure}/${fileName}`);
      } catch (error) {
        console.warn(`Could not load overlay image: ${selectedProcedure}/${fileName}`);
      }
    }
    
    return null;
  };

  const dataURLtoBlob = (dataURL: string) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
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
                      background: "white",
                      padding: isMobile ? "8px 8px" : "15px 20px"
                    }}
                  >
                    <img 
                      src={`${process.env.PUBLIC_URL}/images/SignatureLogo.png`} 
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
                  <hr style={{ margin: 0, borderColor: "#1C2220", borderWidth: "1px" }} />

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
                                    {selectedProcedure && <img src={getOverlayImage()} alt={`${selectedProcedure} Guide`} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxWidth: "60%", maxHeight: "60%", pointerEvents: "none", opacity: 0.6, objectFit: "contain" }} />}
                                    <div style={{ position: "absolute", top: 10, left: 10, color: "white", background: "rgba(0,0,0,0.8)", padding: "5px 10px", borderRadius: "5px", fontSize: "11px" }}>
                                      {selectedProcedure} - {currentAngle} ({Object.keys(capturedPhotos).length + 1}/{requiredAngles.length})
                                    </div>
                                    <div style={{ position: "absolute", bottom: 20, width: "100%", display: "flex", justifyContent: "center" }}>
                                      <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setCameraActive(false)}>Cancel</button>
                                        <button type="button" className="btn btn-light btn-sm" onClick={handleCapturePhoto}>Capture</button>
                                        {Object.keys(capturedPhotos).length > 0 && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCameraActive(false)}>Done</button>}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "black", zIndex: 1060 }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    {selectedProcedure && <img src={getOverlayImage()} alt={`${selectedProcedure} Guide`} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxWidth: "60%", maxHeight: "60%", pointerEvents: "none", opacity: 0.6, objectFit: "contain" }} />}
                                    <div style={{ position: "absolute", top: 10, left: 10, color: "white", background: "rgba(0,0,0,0.8)", padding: "5px 10px", borderRadius: "5px", fontSize: "11px" }}>
                                      {selectedProcedure} - {currentAngle} ({Object.keys(capturedPhotos).length + 1}/{requiredAngles.length})
                                    </div>
                                    <div style={{ position: "absolute", bottom: 20, width: "100%", display: "flex", justifyContent: "center" }}>
                                      <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setCameraActive(false)}>Cancel</button>
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
                                    }} onClick={() => { if (!selectedProcedure) { setPhotoError("Select procedure first"); return; } const angles = getProcedureAngles(selectedProcedure); setRequiredAngles(angles); setCurrentAngle(angles[0] || ""); setPhotoError(""); setCameraActive(true); }} onMouseEnter={(e) => {
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
                        {photoError && (
                          <div className="text-center mt-2">
                            <small className="text-danger">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {photoError}
                            </small>
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
                          disabled={isSubmitting}
                          style={{
                            background: isSubmitting ? "#6c757d" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            color: "white",
                            borderRadius: "8px",
                            padding: isMobile ? "8px 16px" : "10px 20px",
                            fontSize: isMobile ? "0.9rem" : "1rem",
                            fontWeight: "600",
                            opacity: isSubmitting ? 0.7 : 1
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              {isMobile ? "Submit" : "Submit Form"}
                            </>
                          )}
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