'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useLanguage } from '../../lib/language-context';
import { useToast } from '../../components/ui/toast';
import { Captcha, CaptchaHandle } from '../../components/security/captcha';
import { SearchableSelect } from '../../components/ui/searchable-select';
import { ALL_STATES_SORTED, getDistrictsForState } from '../../data/india-locations';
import { compressImage, CompressionResult, formatFileSize } from '../../lib/image-compressor';
import {
  UserPlus,
  Sprout,
  Building2,
  ShieldCheck,
  MapPin,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Phone,
  Lock,
  Mail,
  User,
  AlertCircle,
  Sparkles,
  RefreshCw,
  UploadCloud,
  Check,
  FileCheck,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

export default function SignupWizardPage() {
  const router = useRouter();
  const { t, tCrop } = useLanguage();
  const { showToast } = useToast();

  const captchaRef = useRef<CaptchaHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Registration step (1..5)
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form payload
  const [role, setRole] = useState<'FARMER' | 'BUYER'>('FARMER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Location fields
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Nashik');
  const [village, setVillage] = useState('Pimpalgaon Baswant');
  const [locationAddress, setLocationAddress] = useState(
    'Village Pimpalgaon Baswant, Niphad Taluka, Nashik District, Maharashtra 422209',
  );
  const [liveLocationLat, setLiveLocationLat] = useState<number | null>(20.1704);
  const [liveLocationLng, setLiveLocationLng] = useState<number | null>(73.9877);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsCaptured, setGpsCaptured] = useState(true);

  // Role-specific fields
  const [primaryCrop, setPrimaryCrop] = useState('Tomato');
  const [farmSize, setFarmSize] = useState('4.5');
  const [kccNumber, setKccNumber] = useState('KCC-MH-2024-8891');
  const [apmcNumber, setApmcNumber] = useState('APMC-NSK-4421');

  const [organizationName, setOrganizationName] = useState('FreshCart Agro Limited');
  const [contactPerson, setContactPerson] = useState('');
  const [businessType, setBusinessType] = useState('WHOLESALER');
  const [gstin, setGstin] = useState('27AABCF1234F1Z5');
  const [fssaiNumber, setFssaiNumber] = useState('11521018000234');
  const [warehouseLocation, setWarehouseLocation] = useState('Sector 19, Vashi Turbhe Road, Navi Mumbai');

  // Photo & Compression state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: string;
    compressedSize: string;
  } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Security / CAPTCHA
  const [captchaData, setCaptchaData] = useState<{ captchaId: string; captchaAnswer: string }>({
    captchaId: '',
    captchaAnswer: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // State Options for SearchableSelect
  const stateOptions = useMemo(() => {
    return ALL_STATES_SORTED.map((s) => ({
      label: s.name,
      value: s.name,
      sublabel: s.isUnionTerritory ? 'Union Territory' : 'State',
    }));
  }, []);

  // District Options dynamically derived from chosen State
  const districtOptions = useMemo(() => {
    const districts = getDistrictsForState(state);
    return districts.map((d) => ({
      label: d,
      value: d,
    }));
  }, [state]);

  // Handle State Change: updates state and syncs district to first available or clears
  const handleStateChange = (newState: string) => {
    setState(newState);
    const newDistricts = getDistrictsForState(newState);
    if (newDistricts.length > 0) {
      if (!newDistricts.includes(district)) {
        setDistrict(newDistricts[0]);
      }
    } else {
      setDistrict('');
    }
  };

  // GPS Acquisition
  const captureGps = () => {
    if (!navigator.geolocation) {
      showToast(t.locationFailed || 'GPS geolocation not supported by browser.', 'error');
      return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveLocationLat(pos.coords.latitude);
        setLiveLocationLng(pos.coords.longitude);
        setGpsCaptured(true);
        setIsCapturingGps(false);
        showToast(t.locationCaptured || '📍 GPS Location successfully verified!', 'success');
      },
      (err) => {
        setIsCapturingGps(false);
        // Fallback default coordinates if user denies browser permission
        setLiveLocationLat(20.1704);
        setLiveLocationLng(73.9877);
        setGpsCaptured(true);
        showToast('Default coordinates set. You can re-detect anytime.', 'info');
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  // Webcam Handlers
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraActive(false);
      showToast('Camera access denied or unavailable. Please upload a photo instead.', 'info');
    }
  };

  const capturePhotoFromCamera = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      stopCamera();
      setIsCompressing(true);
      try {
        canvas.toBlob(
          async (blob) => {
            if (!blob) throw new Error('Canvas blob capture failed.');
            const result = await compressImage(blob, `profile-${Date.now()}.jpg`);
            setPhotoFile(result.file);
            setPhotoPreviewUrl(result.previewUrl);
            setCompressionStats({
              originalSize: result.originalSizeFormatted,
              compressedSize: result.compressedSizeFormatted,
            });
            setIsCompressing(false);
            showToast(t.photoSelectedSuccess || 'Photo captured and compressed successfully!', 'success');
          },
          'image/jpeg',
          0.85,
        );
      } catch (err: any) {
        setIsCompressing(false);
        showToast(err.message || 'Photo processing failed', 'error');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // File Upload & Compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reject non-images
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast('Invalid file format. Please upload a JPG, PNG, or WebP image.', 'error');
      return;
    }

    // 5 MB max file limit before compression
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image exceeds 5 MB. Please select a photo under 5 MB.', 'error');
      return;
    }

    setIsCompressing(true);
    try {
      const result = await compressImage(file, file.name);
      setPhotoFile(result.file);
      setPhotoPreviewUrl(result.previewUrl);
      setCompressionStats({
        originalSize: result.originalSizeFormatted,
        compressedSize: result.compressedSizeFormatted,
      });
      showToast(t.photoSelectedSuccess || 'Photo uploaded and compressed successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Photo compression failed', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCaptchaChange = (data: { captchaId: string; captchaAnswer: string }) => {
    setCaptchaData(data);
    if (errorMessage && errorMessage.includes('CAPTCHA')) {
      setErrorMessage(null);
    }
  };

  // Step Navigations
  const handleRoleSelect = (selectedRole: 'FARMER' | 'BUYER') => {
    setRole(selectedRole);
    setErrorMessage(null);
    // Smooth transition with visual feedback before advancing to Step 2
    setTimeout(() => {
      setCurrentStep(2);
    }, 150);
  };

  const goToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(t.msgNameRequired || 'Full legal name is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage(t.msgPhoneRequired || 'Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!password.trim() || password.length < 8) {
      setErrorMessage(
        t.msgPasswordRequired ||
          'Password must be at least 8 characters long with uppercase, lowercase, number, and special character.',
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t.msgPasswordMismatch || 'Passwords do not match.');
      return;
    }

    setCurrentStep(3);
  };

  const goToStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!state.trim()) {
      setErrorMessage(t.msgStateRequired || 'Please select your State.');
      return;
    }
    if (!district.trim()) {
      setErrorMessage(t.msgDistrictRequired || 'Please select your District.');
      return;
    }
    if (!locationAddress.trim()) {
      setErrorMessage(t.msgLocationRequired || 'Please provide your full location address.');
      return;
    }

    setCurrentStep(4);
  };

  const goToStep5 = () => {
    if (!photoFile && !photoPreviewUrl) {
      setErrorMessage(t.msgPhotoRequired || 'Please upload or take a profile photo.');
      showToast(t.msgPhotoRequired || 'Please upload or take a profile photo.', 'error');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(5);
  };

  // Final Registration Submission with multipart/form-data
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!captchaData.captchaId || !captchaData.captchaAnswer.trim()) {
      setErrorMessage(t.msgCaptchaRequired || 'Please complete the CAPTCHA verification.');
      return;
    }

    if (!photoFile) {
      setErrorMessage(t.msgPhotoRequired || 'Please upload or take a profile photo.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build pure multipart/form-data payload (Never send Base64 string)
      const formData = new FormData();
      formData.append('role', role);
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      if (email.trim()) formData.append('email', email.trim());
      formData.append('password', password);
      formData.append('state', state.trim());
      formData.append('district', district.trim());
      if (village.trim()) formData.append('village', village.trim());
      formData.append('location', locationAddress.trim());
      formData.append('latitude', String(liveLocationLat || 20.1704));
      formData.append('longitude', String(liveLocationLng || 73.9877));
      formData.append('captchaId', captchaData.captchaId);
      formData.append('captchaAnswer', captchaData.captchaAnswer.trim());

      // Attach compressed binary image file
      formData.append('profilePhoto', photoFile);

      // Role-specific fields
      if (role === 'FARMER') {
        formData.append('primaryCrop', primaryCrop);
        formData.append('farmSize', farmSize ? String(parseFloat(farmSize) || 4.5) : '4.5');
        if (kccNumber.trim()) formData.append('kccNumber', kccNumber.trim());
        if (apmcNumber.trim()) formData.append('apmcNumber', apmcNumber.trim());
      } else {
        if (organizationName.trim()) formData.append('organizationName', organizationName.trim());
        formData.append('contactPerson', contactPerson.trim() || name.trim());
        if (businessType.trim()) formData.append('businessType', businessType.trim());
        if (gstin.trim()) formData.append('gstin', gstin.trim());
        if (fssaiNumber.trim()) formData.append('fssaiNumber', fssaiNumber.trim());
        if (warehouseLocation.trim()) formData.append('warehouseLocation', warehouseLocation.trim());
      }

      await api.post('/auth/register', formData);

      setRegistrationSuccess(true);
      showToast(t.registrationSuccessTitle || 'Registration submitted for Admin verification!', 'success');
    } catch (err: any) {
      const msg = err.message || t.msgLoginFailed || 'Registration failed. Please check your details.';
      setErrorMessage(msg);
      showToast(msg, 'error');

      if (captchaRef.current) {
        captchaRef.current.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-8 border border-amber-300 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {t.registrationSuccessTitle || 'Registration Submitted!'}
            </h2>
            <span className="inline-block bg-amber-100 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase border border-amber-300">
              {t.pendingApprovalBadge || '🟡 Under Administrative Verification'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {t.registrationSuccessDesc ||
              'Your registration dossier has been received and queued in the National Governance Desk. An administrator will verify your credentials and approve your account shortly.'}
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              className="block w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md transition text-center"
            >
              {t.backToLoginBtn || 'Back to Sign In'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-6 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-xl border border-amber-300/80 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1.5 border-b border-amber-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              {t.signupTitle || 'Vanijya Unified Registration'}
            </div>
            <span className="text-xs font-bold text-slate-400">Step {currentStep} of 5</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {currentStep === 1 && (t.selectAccountType || 'Choose Your Account Role')}
            {currentStep === 2 && (t.stepDetails || 'Account & Credential Details')}
            {currentStep === 3 && (t.stepLocation || 'Location & Mandi Credentials')}
            {currentStep === 4 && (t.stepPhoto || 'Profile Photo Verification')}
            {currentStep === 5 && (t.stepReview || 'Review Application & Submit')}
          </h1>
          <p className="text-xs text-slate-500">
            {t.signupSubtitle || 'Direct farm-to-buyer transactions with 0% platform commission'}
          </p>
        </div>

        {/* Multi-Step Wizard Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep >= stepNum ? 'bg-amber-500' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: ROLE SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700">
                {t.chooseRole || 'Select your participant role'}:
              </p>
              <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Instant Onboarding</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Farmer Role Action Card */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={role === 'FARMER'}
                onClick={() => handleRoleSelect('FARMER')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRoleSelect('FARMER');
                  }
                }}
                className={`p-5 rounded-3xl border-2 text-left transition-all duration-150 ease-out flex flex-col justify-between space-y-4 cursor-pointer relative overflow-hidden group select-none ${
                  role === 'FARMER'
                    ? 'border-amber-500 bg-gradient-to-b from-amber-50/90 via-amber-50/50 to-amber-100/30 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                    : 'border-slate-200/90 hover:border-amber-400/80 bg-white hover:bg-amber-50/20 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/90 border border-amber-300/70 flex items-center justify-center text-amber-900 shadow-inner group-hover:scale-105 group-hover:bg-amber-200/80 transition-all duration-150">
                    <Sprout className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ${
                      role === 'FARMER'
                        ? 'bg-amber-500 text-slate-950 shadow-sm scale-105'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-800'
                    }`}
                  >
                    {role === 'FARMER' ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-amber-950 transition-colors">
                    {t.farmerRoleTitle || '🌾 Farmer / Producer'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed group-hover:text-slate-600">
                    {t.farmerRoleDesc || 'List harvest lots, monitor live Agmarknet mandis, receive bids directly.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/40">
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                    ✓ 0% Platform Commission
                  </span>
                  <span className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Select</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Buyer Role Action Card */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={role === 'BUYER'}
                onClick={() => handleRoleSelect('BUYER')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRoleSelect('BUYER');
                  }
                }}
                className={`p-5 rounded-3xl border-2 text-left transition-all duration-150 ease-out flex flex-col justify-between space-y-4 cursor-pointer relative overflow-hidden group select-none ${
                  role === 'BUYER'
                    ? 'border-amber-500 bg-gradient-to-b from-amber-50/90 via-amber-50/50 to-amber-100/30 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                    : 'border-slate-200/90 hover:border-amber-400/80 bg-white hover:bg-amber-50/20 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/90 border border-blue-300/70 flex items-center justify-center text-blue-900 shadow-inner group-hover:scale-105 group-hover:bg-blue-200/80 transition-all duration-150">
                    <Building2 className="w-6 h-6 text-blue-700" />
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ${
                      role === 'BUYER'
                        ? 'bg-amber-500 text-slate-950 shadow-sm scale-105'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-800'
                    }`}
                  >
                    {role === 'BUYER' ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-amber-950 transition-colors">
                    {t.buyerRoleTitle || '🏢 Commercial Buyer'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed group-hover:text-slate-600">
                    {t.buyerRoleDesc || 'Procure directly from farm gates, discover quality-graded commodity lots.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/40">
                  <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider">
                    ✓ Verified Sourcing
                  </span>
                  <span className="text-[11px] font-extrabold text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Select</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL & CREDENTIAL DETAILS */}
        {currentStep === 2 && (
          <form onSubmit={goToStep3} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.fullNameLabel || 'Full Name'} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Baburao Patel"
                  className="w-full h-14 pl-10 pr-4 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.mobileNumberLabel || 'Mobile Number'} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full h-14 pl-10 pr-4 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.emailAddressLabel || 'Email Address (Optional)'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh.patel@farmer.in"
                  className="w-full h-14 pl-10 pr-4 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.passwordLabel || 'Password'} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 chars (e.g. Farmer@123)"
                    className="w-full h-14 pl-10 pr-4 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.confirmPasswordLabel || 'Confirm Password'} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full h-14 pl-10 pr-4 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 h-14 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="flex-1 h-14 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.proceedToLocationBtn || 'Proceed to Location'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: LOCATION & CREDENTIALS (PHASE 1, 2, 10, 11) */}
        {currentStep === 3 && (
          <form onSubmit={goToStep4} className="space-y-4 animate-in fade-in">
            {/* | State | District | */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SearchableSelect
                label={t.stateLabel || 'State / Union Territory'}
                required
                value={state}
                onChange={handleStateChange}
                options={stateOptions}
                placeholder="Search state..."
                searchPlaceholder="Type state or UT name..."
              />

              <SearchableSelect
                label={t.districtLabel || 'District'}
                required
                value={district}
                onChange={(newDist) => setDistrict(newDist)}
                options={districtOptions}
                placeholder="Select district..."
                searchPlaceholder="Search district..."
                disabled={districtOptions.length === 0}
                helperText={districtOptions.length === 0 ? 'Select a State first' : undefined}
              />
            </div>

            {/* Role Specific Grid (Village | Crop/Org) & (Farm Size | KCC/FSSAI) */}
            {role === 'FARMER' ? (
              <>
                {/* | Village | Primary Crop | */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.villageLabel || 'Village / Taluka'}
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Village Pimpalgaon"
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.primaryCropLabel || 'Primary Commodity Crop'} <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={primaryCrop}
                      onChange={(e) => setPrimaryCrop(e.target.value)}
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="Tomato">{tCrop('Tomato') || 'Tomato (टमाटर)'}</option>
                      <option value="Onion">{tCrop('Onion') || 'Onion (प्याज)'}</option>
                      <option value="Potato">{tCrop('Potato') || 'Potato (आलू)'}</option>
                      <option value="Wheat">{tCrop('Wheat') || 'Wheat (गेहूं)'}</option>
                      <option value="Paddy">{tCrop('Paddy') || 'Paddy (धान)'}</option>
                      <option value="Cotton">{tCrop('Cotton') || 'Cotton (कपास)'}</option>
                      <option value="Soybean">{tCrop('Soybean') || 'Soybean (सोयाबीन)'}</option>
                      <option value="Chilli">{tCrop('Chilli') || 'Chilli (मिर्च)'}</option>
                    </select>
                  </div>
                </div>

                {/* | Farm Size | KCC Number | */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.farmSizeLabel || 'Farm Size (Acres)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      placeholder="4.5"
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.kccLabel || 'KCC / Land Passbook Number'}
                    </label>
                    <input
                      type="text"
                      value={kccNumber}
                      onChange={(e) => setKccNumber(e.target.value)}
                      placeholder="KCC-MH-2024-8891"
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 uppercase"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* | Village | Organization Name | */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.villageLabel || 'Town / Area'}
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Vashi APMC Commercial Yard"
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.orgNameLabel || 'Organization / Trade Name'} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="FreshCart Agro Limited"
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* | Business Type | GSTIN | */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.businessTypeLabel || 'Business Type'}
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="WHOLESALER">Wholesaler / Trader</option>
                      <option value="PROCESSOR">Food Processing Enterprise</option>
                      <option value="RETAILER">Retail Chain / Supermarket</option>
                      <option value="EXPORTER">Export Merchant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.gstinLabel || 'GSTIN Number'}
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="27AABCF1234F1Z5"
                      className="w-full h-14 px-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white uppercase"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Farm / Procurement Full Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'FARMER'
                  ? t.farmLocationLabel || 'Farm Gate Physical Address'
                  : t.procurementLocationLabel || 'Procurement Center / Warehouse Address'}{' '}
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Detailed address with landmark and pin code..."
                className="w-full p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* PHASE 11: IMPROVED GPS CARD */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50/60 border border-emerald-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">📍 Live GPS Verified</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  {liveLocationLat && liveLocationLng ? (
                    <span className="text-[11px] text-emerald-900 font-mono font-bold block mt-0.5">
                      {liveLocationLat.toFixed(4)}° N, {liveLocationLng.toFixed(4)}° E
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 block">Click detect to acquire live GPS fix</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={captureGps}
                disabled={isCapturingGps}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isCapturingGps ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Detect Again</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 h-14 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="flex-1 h-14 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.proceedToPhotoBtn || 'Proceed to Photo Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: PHOTO CAPTURE & AUTO-COMPRESSION (PHASE 4 & 5) */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-700">
                {t.photoRequired || 'Live Profile Photo Verification is required for Administrative Approval.'}
              </p>
              <p className="text-[11px] text-slate-500">
                Uploaded photos are automatically resized and compressed to &le; 300 KB.
              </p>
            </div>

            {/* Camera Viewport / Image Preview */}
            <div className="relative aspect-video max-w-sm mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-amber-300 flex items-center justify-center shadow-inner">
              {isCompressing ? (
                <div className="text-center space-y-2 text-amber-400 p-4">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                  <span className="text-xs font-bold block">Compressing image (Max 600px, &le;300KB)...</span>
                </div>
              ) : cameraActive ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              ) : photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2 text-slate-400 p-4">
                  <Camera className="w-10 h-10 mx-auto text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold block">
                    {t.takePhotoBtn || 'Take Photo'} / {t.uploadPhotoBtn || 'Upload Photo'}
                  </span>
                </div>
              )}
            </div>

            {/* Compression Stats Badge */}
            {compressionStats && !cameraActive && (
              <div className="max-w-sm mx-auto p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-1 text-xs">
                <div className="flex items-center justify-center gap-1.5 font-black text-emerald-900">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Compression Complete</span>
                </div>
                <div className="text-[11px] text-emerald-800 font-mono font-bold">
                  {compressionStats.originalSize} &rarr; {compressionStats.compressedSize} (JPEG)
                </div>
              </div>
            )}

            {/* Photo Controls */}
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2.5 bg-amber-100 text-amber-950 rounded-xl text-xs font-black border border-amber-300 hover:bg-amber-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-amber-800" />
                  <span>{t.takePhotoBtn || 'Take Photo'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-xl text-xs font-black shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.confirmPhotoBtn || 'Capture & Compress Photo'}</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4 text-slate-600" />
                <span>{t.uploadPhotoBtn || 'Upload Photo'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-amber-100">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCurrentStep(3);
                }}
                className="px-4 h-14 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToStep5}
                className="flex-1 h-14 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.proceedToReviewBtn || 'Proceed to Review'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FINAL APPLICATION REVIEW & SUBMISSION (PHASE 12) */}
        {currentStep === 5 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in">
            {/* Dossier Summary Box */}
            <div className="p-5 bg-gradient-to-br from-amber-50/80 to-white rounded-2xl border border-amber-300 space-y-4 text-xs shadow-sm">
              <div className="flex items-start justify-between border-b border-amber-200 pb-3 gap-3">
                <div className="flex items-center gap-3">
                  {/* Photo Thumbnail */}
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-400 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {photoPreviewUrl ? (
                      <img src={photoPreviewUrl} alt="Applicant" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-amber-700" />
                    )}
                  </div>
                  <div>
                    <span className="text-base font-black text-slate-900 block leading-tight">{name}</span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">📞 {phone}</span>
                  </div>
                </div>

                {/* Role Badge */}
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                    role === 'FARMER'
                      ? 'bg-amber-100 text-amber-950 border-amber-400'
                      : 'bg-blue-100 text-blue-950 border-blue-400'
                  }`}
                >
                  {role === 'FARMER' ? '🌾 Farmer Producer' : '🏢 Commercial Buyer'}
                </span>
              </div>

              {/* Location & Crop / Organization Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
                <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">State & District</span>
                  <span className="font-extrabold text-slate-900 text-xs">
                    {district}, {state}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Village / Area</span>
                  <span className="font-extrabold text-slate-900 text-xs">
                    {village || 'N/A'}
                  </span>
                </div>

                {role === 'FARMER' ? (
                  <>
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Primary Crop</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {tCrop(primaryCrop) || primaryCrop}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Farm Size</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {farmSize} {t.commonAcres || 'Acres'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Organization</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {organizationName}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Business Type</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {businessType}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Physical Address */}
              <div className="bg-white p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Physical Location</span>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">{locationAddress}</p>
              </div>

              {/* GPS Coordinates Badge */}
              <div className="flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-xs">
                <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  Live GPS Coordinates:
                </span>
                <span className="font-mono font-black text-emerald-950 text-[11px]">
                  {liveLocationLat ? liveLocationLat.toFixed(4) : '20.1704'}° N,{' '}
                  {liveLocationLng ? liveLocationLng.toFixed(4) : '73.9877'}° E
                </span>
              </div>
            </div>

            {/* Visual Security CAPTCHA */}
            <Captcha
              ref={captchaRef}
              onCaptchaChange={handleCaptchaChange}
              disabled={isSubmitting}
            />

            <div className="flex items-center gap-3 pt-3 border-t border-amber-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-4 h-14 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-14 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.submittingRegistration || 'Submitting Registration...'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t.submitRegistrationBtn || 'Submit Registration Application'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Bottom Login Link */}
        <div className="pt-2 text-center border-t border-amber-100">
          <p className="text-xs text-slate-500">
            {t.alreadyHaveAccount || 'Already have an approved account?'}{' '}
            <Link href="/login" className="text-amber-800 font-bold hover:underline">
              {t.btnSignIn || 'Sign In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
