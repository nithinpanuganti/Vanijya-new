'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useLanguage } from '../../lib/language-context';
import { useToast } from '../../components/ui/toast';
import { Captcha, CaptchaHandle } from '../../components/security/captcha';
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
  RotateCcw,
  Sparkles,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

export default function SignupWizardPage() {
  const router = useRouter();
  const { t, tCrop } = useLanguage();
  const { showToast } = useToast();

  const captchaRef = useRef<CaptchaHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Registration step
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
  const [locationAddress, setLocationAddress] = useState('Pimpalgaon Baswant, Niphad Taluka, Nashik District, Maharashtra 422209');
  const [liveLocationLat, setLiveLocationLat] = useState<number | null>(20.1744);
  const [liveLocationLng, setLiveLocationLng] = useState<number | null>(73.9875);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsCaptured, setGpsCaptured] = useState(true);

  // Role-specific fields
  const [primaryCrop, setPrimaryCrop] = useState('Tomato');
  const [farmSize, setFarmSize] = useState('5');
  const [kccNumber, setKccNumber] = useState('KCC-MH-882194');
  const [apmcRegistrationNumber, setApmcRegistrationNumber] = useState('APMC-NSK-4421');

  const [organizationName, setOrganizationName] = useState('FreshCart Agro Commodities Pvt Ltd');
  const [contactPerson, setContactPerson] = useState('');
  const [businessType, setBusinessType] = useState('Wholesale Food Processing');
  const [gstin, setGstin] = useState('27AABCF1234E1Z6');
  const [fssaiNumber, setFssaiNumber] = useState('10019022009871');
  const [warehouseLocation, setWarehouseLocation] = useState('Plot 42, MIDC Ambad, Nashik');

  // Photo state
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);

  // Security / CAPTCHA
  const [captchaData, setCaptchaData] = useState<{ captchaId: string; captchaAnswer: string }>({
    captchaId: '',
    captchaAnswer: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // GPS Acquisition
  const captureGps = () => {
    if (!navigator.geolocation) {
      showToast(t.locationFailed, 'error');
      return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveLocationLat(pos.coords.latitude);
        setLiveLocationLng(pos.coords.longitude);
        setGpsCaptured(true);
        setIsCapturingGps(false);
        showToast(t.locationCaptured, 'success');
      },
      () => {
        setIsCapturingGps(false);
        showToast(t.locationFailed, 'error');
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

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoDataUrl(dataUrl);
      stopCamera();
      showToast(t.photoSelectedSuccess, 'success');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string);
      showToast(t.photoSelectedSuccess, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleCaptchaChange = (data: { captchaId: string; captchaAnswer: string }) => {
    setCaptchaData(data);
    if (errorMessage && errorMessage.includes('CAPTCHA')) {
      setErrorMessage(null);
    }
  };

  // Step Navigations
  const goToStep2 = () => {
    setCurrentStep(2);
  };

  const goToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(t.msgNameRequired);
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage(t.msgPhoneRequired);
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMessage(t.msgPasswordRequired);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t.msgPasswordMismatch);
      return;
    }

    setCurrentStep(3);
  };

  const goToStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!state.trim()) {
      setErrorMessage(t.msgStateRequired);
      return;
    }
    if (!district.trim()) {
      setErrorMessage(t.msgDistrictRequired);
      return;
    }
    if (!locationAddress.trim()) {
      setErrorMessage(t.msgLocationRequired);
      return;
    }

    setCurrentStep(4);
  };

  const goToStep5 = () => {
    if (!photoDataUrl) {
      showToast(t.photoRequired, 'error');
      return;
    }
    setCurrentStep(5);
  };

  // Final Registration Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!captchaData.captchaId || !captchaData.captchaAnswer.trim()) {
      setErrorMessage(t.msgCaptchaRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        role,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        state: state.trim(),
        district: district.trim(),
        village: village.trim() || undefined,
        location: locationAddress.trim(),
        liveLocationLat: liveLocationLat || undefined,
        liveLocationLng: liveLocationLng || undefined,
        photoUrl: photoDataUrl || undefined,
        captchaId: captchaData.captchaId,
        captchaAnswer: captchaData.captchaAnswer.trim(),
      };

      if (role === 'FARMER') {
        payload.primaryCrop = primaryCrop;
        payload.farmSize = parseFloat(farmSize) || 5;
        payload.kccNumber = kccNumber.trim() || undefined;
        payload.apmcRegistrationNumber = apmcRegistrationNumber.trim() || undefined;
      } else {
        payload.organizationName = organizationName.trim() || undefined;
        payload.contactPerson = contactPerson.trim() || name.trim();
        payload.businessType = businessType.trim() || undefined;
        payload.gstin = gstin.trim() || undefined;
        payload.fssaiNumber = fssaiNumber.trim() || undefined;
        payload.warehouseLocation = warehouseLocation.trim() || undefined;
      }

      await api.post('/auth/register', payload);

      setRegistrationSuccess(true);
      showToast(t.registrationSuccessTitle, 'success');
    } catch (err: any) {
      const msg = err.message || t.msgLoginFailed;
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
              {t.registrationSuccessTitle}
            </h2>
            <span className="inline-block bg-amber-100 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase border border-amber-300">
              {t.pendingApprovalBadge}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {t.registrationSuccessDesc}
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              className="block w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md transition"
            >
              {t.backToLoginBtn}
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
              {t.signupTitle}
            </div>
            <span className="text-xs font-bold text-slate-400">Step {currentStep} of 5</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {currentStep === 1 && t.selectAccountType}
            {currentStep === 2 && t.stepDetails}
            {currentStep === 3 && t.stepLocation}
            {currentStep === 4 && t.stepPhoto}
            {currentStep === 5 && t.stepReview}
          </h1>
          <p className="text-xs text-slate-500">{t.signupSubtitle}</p>
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
          <div className="space-y-4 animate-in fade-in">
            <p className="text-xs font-bold text-slate-600">{t.chooseRole}:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setRole('FARMER')}
                className={`p-5 rounded-3xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
                  role === 'FARMER'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/30 shadow-md'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900">
                  <Sprout className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{t.farmerRoleTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">{t.farmerRoleDesc}</p>
                </div>
                <span className="text-[10px] font-black text-amber-900 uppercase">✓ 0% Platform Commission</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('BUYER')}
                className={`p-5 rounded-3xl border text-left transition flex flex-col justify-between space-y-3 cursor-pointer ${
                  role === 'BUYER'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/30 shadow-md'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-900">
                  <Building2 className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{t.buyerRoleTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">{t.buyerRoleDesc}</p>
                </div>
                <span className="text-[10px] font-black text-blue-900 uppercase">✓ Verified Sourcing</span>
              </button>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={goToStep2}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.continueToDetailsBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONAL & CREDENTIAL DETAILS */}
        {currentStep === 2 && (
          <form onSubmit={goToStep3} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.fullNameLabel} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Baburao Patel"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.mobileNumberLabel} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.emailAddressLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh.patel@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.passwordLabel} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.confirmPasswordLabel} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.proceedToLocationBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: LOCATION & AGRICULTURAL CREDENTIALS */}
        {currentStep === 3 && (
          <form onSubmit={goToStep4} className="space-y-4 animate-in fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.stateLabel} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.districtLabel} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {role === 'FARMER' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.villageLabel}
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Village Pimpalgaon"
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.primaryCropLabel}
                    </label>
                    <select
                      value={primaryCrop}
                      onChange={(e) => setPrimaryCrop(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                    >
                      <option value="Tomato">{tCrop('Tomato')}</option>
                      <option value="Onion">{tCrop('Onion')}</option>
                      <option value="Potato">{tCrop('Potato')}</option>
                      <option value="Wheat">{tCrop('Wheat')}</option>
                      <option value="Paddy">{tCrop('Paddy')}</option>
                      <option value="Maize">{tCrop('Maize')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.farmSizeLabel}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.kccLabel}
                    </label>
                    <input
                      type="text"
                      value={kccNumber}
                      onChange={(e) => setKccNumber(e.target.value)}
                      placeholder="KCC-MH-882194"
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.orgNameLabel}
                    </label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.businessTypeLabel}
                    </label>
                    <input
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.gstinLabel}
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="27AABCF1234E1Z6"
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.fssaiLabel}
                    </label>
                    <input
                      type="text"
                      value={fssaiNumber}
                      onChange={(e) => setFssaiNumber(e.target.value)}
                      placeholder="10019022009871"
                      className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'FARMER' ? t.farmLocationLabel : t.procurementLocationLabel} <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Live GPS Capture Box */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-slate-900 block">
                    {gpsCaptured ? t.locationCaptured : t.useCurrentLocationBtn}
                  </span>
                  {liveLocationLat && liveLocationLng && (
                    <span className="text-[10px] text-emerald-800 font-mono">
                      {liveLocationLat.toFixed(4)}, {liveLocationLng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={captureGps}
                disabled={isCapturingGps}
                className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-black rounded-xl text-xs transition cursor-pointer"
              >
                {isCapturingGps ? t.commonLoading : t.refreshLocationBtn}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.proceedToPhotoBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: PHOTO CAPTURE / UPLOAD */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-500">
                {t.photoRequired}
              </p>
            </div>

            {/* Camera Viewport / Image Preview */}
            <div className="relative aspect-video max-w-sm mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-amber-300 flex items-center justify-center shadow-inner">
              {cameraActive ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              ) : photoDataUrl ? (
                <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2 text-slate-400 p-4">
                  <Camera className="w-10 h-10 mx-auto text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold block">{t.takePhotoBtn} / {t.uploadPhotoBtn}</span>
                </div>
              )}
            </div>

            {/* Photo Controls */}
            <div className="flex flex-wrap gap-2 justify-center">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-amber-100 text-amber-950 rounded-xl text-xs font-black border border-amber-300 hover:bg-amber-200 transition cursor-pointer"
                >
                  📷 {t.takePhotoBtn}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-xl text-xs font-black shadow transition cursor-pointer"
                >
                  📸 {t.confirmPhotoBtn}
                </button>
              )}

              <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer">
                📁 {t.uploadPhotoBtn}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-amber-100">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCurrentStep(3);
                }}
                className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToStep5}
                className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.proceedToReviewBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: FINAL APPLICATION REVIEW & CAPTCHA */}
        {currentStep === 5 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in">
            {/* Dossier Summary Box */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="font-extrabold text-slate-900">{name}</span>
                <span className="bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-full uppercase text-[10px]">
                  {role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>📞 <strong>{t.mobileNumberLabel}:</strong> {phone}</div>
                <div>📍 <strong>{t.districtLabel}:</strong> {district}, {state}</div>
                {role === 'FARMER' ? (
                  <>
                    <div>🌾 <strong>{t.cropLabel}:</strong> {tCrop(primaryCrop)}</div>
                    <div>📐 <strong>{t.farmSizeLabel}:</strong> {farmSize} {t.commonAcres}</div>
                  </>
                ) : (
                  <>
                    <div>🏢 <strong>{t.orgNameLabel}:</strong> {organizationName}</div>
                    <div>💼 <strong>{t.businessTypeLabel}:</strong> {businessType}</div>
                  </>
                )}
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
                className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.submittingRegistration}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t.submitRegistrationBtn}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Bottom Login Link */}
        <div className="pt-2 text-center border-t border-amber-100">
          <p className="text-xs text-slate-500">
            {t.alreadyHaveAccount}{' '}
            <Link href="/login" className="text-amber-800 font-bold hover:underline">
              {t.btnSignIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
