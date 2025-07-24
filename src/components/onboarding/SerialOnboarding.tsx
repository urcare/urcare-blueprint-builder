import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Calendar, Users, Ruler, Weight, Clock, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthOptions } from '@/components/auth/AuthOptions';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingData {
  fullName: string;
  age: string;
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  gender: string;
  unitSystem: 'imperial' | 'metric';
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  weightLb: string;
  weightKg: string;
  wakeUpTime: string;
  sleepTime: string;
  workStart: string;
  workEnd: string;
  chronicConditions: string[];
  takesMedications: string;
  medications: string[];
  hasSurgery: string;
  surgeryDetails: string[];
  healthGoals: string[];
  dietType: string;
  bloodGroup: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  workoutTime: string;
  routineFlexibility: string;
  usesWearable: string;
  wearableType: string;
  trackFamily: string;
  shareProgress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  criticalConditions: string;
  hasHealthReports: string;
  healthReports: string[];
  referralCode: string;
  saveProgress: string;
}

interface SerialOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onBack: () => void;
}

const steps = [
  { id: 'fullName', title: 'What\'s your full name?', type: 'text', icon: User },
  { id: 'welcome', title: '', type: 'welcome', icon: User },
  { id: 'dateOfBirth', title: 'When were you born?', type: 'dateOfBirth', icon: Calendar },
  { id: 'gender', title: 'What\'s your gender?', type: 'choice', icon: Users },
  { id: 'heightWeight', title: 'Height & weight', type: 'heightWeight', icon: Ruler },
  { id: 'sleepSchedule', title: 'Sleep schedule', type: 'sleepSchedule', icon: Clock },
  { id: 'workSchedule', title: 'What\'s your work schedule?', type: 'timeRange', icon: Briefcase },
  { id: 'chronicConditions', title: 'Do you have any chronic conditions?', type: 'multiChoice', icon: User },
  { id: 'medications', title: 'Do you take any medications?', type: 'medications', icon: User },
  { id: 'surgery', title: 'Have you undergone any major surgery or transplant?', type: 'surgery', icon: User },
  { id: 'healthGoals', title: 'What are your main health goals?', type: 'healthGoals', icon: User },
  { id: 'dietType', title: 'Diet type', type: 'dietChoice', icon: User },
  { id: 'bloodGroup', title: 'What\'s your blood group?', type: 'bloodGroup', icon: Weight },
  { id: 'mealTimings', title: 'Meal timings', type: 'mealTimings', icon: Clock },
  { id: 'workoutTime', title: 'Preferred workout time', type: 'workoutChoice', icon: Clock },
  { id: 'routineFlexibility', title: 'Daily routine flexibility', type: 'slider', icon: User },
  { id: 'wearable', title: 'Do you use a smartwatch/fitness band?', type: 'wearable', icon: User },
  { id: 'trackFamily', title: 'Do you want to track family members\' health too?', type: 'yesNoChoice', icon: Users },
  { id: 'shareProgress', title: 'Would you like to share your health progress with family?', type: 'yesNoChoice', icon: Users },
  { id: 'emergencyContact', title: 'Emergency contact person', type: 'emergencyContact', icon: User },
  { id: 'criticalConditions', title: 'Known allergies or critical conditions', type: 'textArea', icon: User },
  { id: 'healthReports', title: 'Existing health reports to upload?', type: 'fileUpload', icon: User },
  { id: 'referralCode', title: 'Enter referral code (optional)', type: 'referralCode', icon: User },
  { id: 'auth', title: '', type: 'auth', icon: User }
];

// Helper functions for chronic conditions
const getChronicConditions = () => [
  'Diabetes',
  'Hypertension (High Blood Pressure)',
  'Heart Disease',
  'Asthma',
  'Arthritis',
  'Depression/Anxiety',
  'High Cholesterol',
  'Obesity',
  'COPD',
  'Cancer',
  'Kidney Disease',
  'Thyroid Disorders',
  'Allergies',
  'Migraines',
  'None of the above'
];

// Helper functions for date picker
const getMonths = () => [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDays = () => Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 100; year <= currentYear; year++) {
    years.push(year.toString());
  }
  return years;
};

const calculateAge = (birthMonth: string, birthDay: string, birthYear: string) => {
  const monthIndex = getMonths().indexOf(birthMonth);
  const birthDate = new Date(parseInt(birthYear), monthIndex, parseInt(birthDay));
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age.toString();
};

const calculateSleepDuration = (sleepTime: string, wakeTime: string) => {
  if (!sleepTime || !wakeTime) return null;
  
  const [sleepHour, sleepMinute] = sleepTime.split(':').map(Number);
  const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
  
  // Convert times to minutes from midnight
  let sleepMinutes = sleepHour * 60 + sleepMinute;
  let wakeMinutes = wakeHour * 60 + wakeMinute;
  
  // If wake time is earlier than sleep time, assume it's the next day
  if (wakeMinutes <= sleepMinutes) {
    wakeMinutes += 24 * 60; // Add 24 hours
  }
  
  const durationMinutes = wakeMinutes - sleepMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  return { hours, minutes, totalHours: durationMinutes / 60 };
};

// Helper functions for height and weight pickers
const getHeightFeet = () => Array.from({ length: 6 }, (_, i) => (i + 3).toString()); // 3-8 feet
const getHeightInches = () => Array.from({ length: 12 }, (_, i) => i.toString()); // 0-11 inches
const getHeightCm = () => Array.from({ length: 151 }, (_, i) => (i + 100).toString()); // 100-250 cm
const getWeightLb = () => Array.from({ length: 301 }, (_, i) => (i + 50).toString()); // 50-350 lb
const getWeightKg = () => Array.from({ length: 221 }, (_, i) => (i + 30).toString()); // 30-250 kg

// Helper functions for health goals
const getHealthGoals = () => [
  'Disease control',
  'Peak fitness',
  'Weight loss',
  'Mental clarity',
  'Long life',
  'Stress reduction'
];

// Helper function for time options
const getTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

// Custom Wheel Picker Component
interface WheelPickerProps {
  options: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  width: string;
}

const WheelPicker: React.FC<WheelPickerProps> = ({ options, selectedValue, onValueChange, width }) => {
  const selectedIndex = options.indexOf(selectedValue);
  const visibleItems = 7; // Show 7 items at a time (3 above, 1 center, 3 below)
  const itemHeight = 50; // Height of each item in pixels

  // Touch and scroll state
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Enhanced haptic feedback function
  const triggerHapticFeedback = () => {
    try {
      // Modern haptic feedback for supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate([30]); // Short pulse for better feel
      }
    } catch (error) {
      // Silently fail if haptic feedback is not supported
    }
  };

  const getVisibleOptions = () => {
    const result = [];
    const halfVisible = Math.floor(visibleItems / 2);
    
    for (let i = -halfVisible; i <= halfVisible; i++) {
      const index = selectedIndex + i;
      if (index >= 0 && index < options.length) {
        result.push({
          value: options[index],
          index: index,
          offset: i,
          isSelected: i === 0
        });
      } else {
        // Add empty spaces for smooth scrolling
        result.push({
          value: '',
          index: -1,
          offset: i,
          isSelected: false
        });
      }
    }
    return result;
  };

  const handleItemClick = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < options.length && targetIndex !== selectedIndex) {
      triggerHapticFeedback();
      onValueChange(options[targetIndex]);
    }
  };

  const moveUp = () => {
    if (selectedIndex > 0) {
      setIsScrolling(true);
      triggerHapticFeedback();
      onValueChange(options[selectedIndex - 1]);
      setTimeout(() => setIsScrolling(false), 150);
    }
  };

  const moveDown = () => {
    if (selectedIndex < options.length - 1) {
      setIsScrolling(true);
      triggerHapticFeedback();
      onValueChange(options[selectedIndex + 1]);
      setTimeout(() => setIsScrolling(false), 150);
    }
  };

  // Handle mouse wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      moveDown();
    } else {
      moveUp();
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent page scroll
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartY === null) return;
    
    e.preventDefault(); // Prevent scroll on the page
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY - currentY;
    
    // Require minimum movement to trigger scroll (reduced for better sensitivity)
    if (Math.abs(deltaY) > 15) {
      if (deltaY > 0) {
        moveDown();
      } else {
        moveUp();
      }
      setTouchStartY(currentY); // Reset for continuous scrolling
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setTouchStartY(null);
    setIsDragging(false);
  };

  // Handle mouse drag (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStartY(e.clientY);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStartY === null) return;
    
    const currentY = e.clientY;
    const deltaY = touchStartY - currentY;
    
    // Improved sensitivity for desktop dragging
    if (Math.abs(deltaY) > 12) {
      if (deltaY > 0) {
        moveDown();
      } else {
        moveUp();
      }
      setTouchStartY(currentY);
    }
  };

  const handleMouseUp = () => {
    setTouchStartY(null);
    setIsDragging(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveDown();
    }
  };

  return (
    <div 
      className={`relative ${width} h-56 overflow-hidden flex flex-col justify-center focus:outline-none rounded-xl`}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ userSelect: 'none' }}
    >
      {/* Options container */}
      <div className={`flex flex-col items-center justify-center h-full relative transition-all duration-200 ease-out ${isScrolling ? 'scale-105' : 'scale-100'}`}>
        {getVisibleOptions().map((item, index) => {
          if (!item.value) {
            return (
              <div
                key={`empty-${index}`}
                style={{ height: `${itemHeight}px` }}
                className="flex items-center justify-center"
              >
              </div>
            );
          }

          // Calculate opacity and styling based on distance from center - simple bold text
          const distance = Math.abs(item.offset);
          let opacity, fontSize, fontWeight, color, textShadow, transform, zIndex;
          
          if (item.isSelected) {
            // Selected item - simple bold text
            opacity = 1;
            fontSize = 'clamp(16px, 4vw, 20px)';
            fontWeight = '700';
            color = '#111827';
            textShadow = 'none';
            transform = 'scale(1) translateZ(0)';
            zIndex = 10;
          } else if (distance === 1) {
            // Adjacent items - good visibility
            opacity = 0.7;
            fontSize = 'clamp(14px, 3.5vw, 18px)';
            fontWeight = '500';
            color = '#374151';
            textShadow = 'none';
            transform = 'scale(1) translateZ(0)';
            zIndex = 5;
          } else if (distance === 2) {
            // Further items - moderate visibility
            opacity = 0.4;
            fontSize = 'clamp(12px, 3vw, 16px)';
            fontWeight = '400';
            color = '#6b7280';
            textShadow = 'none';
            transform = 'scale(1) translateZ(0)';
            zIndex = 3;
          } else {
            // Farthest items - low visibility
            opacity = 0.2;
            fontSize = 'clamp(11px, 2.5vw, 14px)';
            fontWeight = '400';
            color = '#9ca3af';
            textShadow = 'none';
            transform = 'scale(1) translateZ(0)';
            zIndex = 1;
          }
          
          return (
            <div
              key={`${item.value}-${index}`}
              className="flex items-center justify-center cursor-pointer transition-all duration-300 ease-out px-2"
              style={{
                height: `${itemHeight}px`,
                opacity,
                transform,
                zIndex
              }}
              onClick={() => handleItemClick(item.index)}
            >
              <span 
                className="select-none text-center leading-tight pointer-events-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                style={{
                  fontSize,
                  fontWeight,
                  color,
                  textShadow
                }}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SerialOnboarding: React.FC<SerialOnboardingProps> = ({ onComplete, onBack }) => {
  const { signInWithGoogle } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    age: '',
    birthMonth: 'January',
    birthDay: '1',
    birthYear: '2000',
    gender: '',
    unitSystem: 'metric',
    heightFeet: '5',
    heightInches: '6',
    heightCm: '170',
    weightLb: '150',
    weightKg: '70',
    wakeUpTime: '06:00',
    sleepTime: '22:00',
    workStart: '09:00',
    workEnd: '18:00',
    chronicConditions: [],
    takesMedications: 'No',
    medications: [],
    hasSurgery: 'No',
    surgeryDetails: [],
    healthGoals: [],
    dietType: 'Balanced',
    bloodGroup: '',
    breakfastTime: '07:00',
    lunchTime: '12:00',
    dinnerTime: '19:00',
    workoutTime: 'Morning (06:00-10:00)',
    routineFlexibility: '5',
    usesWearable: 'No',
    wearableType: '',
    trackFamily: 'No',
    shareProgress: 'No',
    emergencyContactName: '',
    emergencyContactPhone: '',
    criticalConditions: '',
    hasHealthReports: 'No',
    healthReports: [],
    referralCode: '',
    saveProgress: 'No'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (stepIndex: number): boolean => {
    const step = steps[stepIndex];
    const newErrors: Record<string, string> = {};

    switch (step.id) {
      case 'fullName':
        if (!data.fullName.trim()) {
          newErrors.fullName = 'Please enter your full name';
        } else if (data.fullName.trim().length < 2) {
          newErrors.fullName = 'Name must be at least 2 characters';
        }
        break;
      case 'welcome':
        // Welcome screen doesn't need validation
        break;
      case 'dateOfBirth':
        if (!data.birthMonth || !data.birthDay || !data.birthYear) {
          newErrors.dateOfBirth = 'Please select your date of birth';
        }
        break;
      case 'gender':
        if (!data.gender) {
          newErrors.gender = 'Please select your gender';
        }
        break;
      case 'heightWeight':
        if (data.unitSystem === 'imperial') {
          if (!data.heightFeet || !data.heightInches || !data.weightLb) {
            newErrors.heightWeight = 'Please enter your height and weight';
          }
        } else {
          if (!data.heightCm || !data.weightKg) {
            newErrors.heightWeight = 'Please enter your height and weight';
          }
        }
        break;
      case 'sleepSchedule':
        if (!data.wakeUpTime || !data.sleepTime) {
          newErrors.sleepSchedule = 'Please set both wake-up and sleep times';
        }
        break;
      case 'workSchedule':
        if (!data.workStart || !data.workEnd) {
          newErrors.workSchedule = 'Please set your work schedule';
        } else if (data.workStart >= data.workEnd) {
          newErrors.workSchedule = 'Work start time must be before end time';
        }
        break;
      case 'chronicConditions':
        // Chronic conditions can be empty (optional), so no validation needed
        break;
      case 'medications':
        if (data.takesMedications === 'Yes' && data.medications.length === 0) {
          newErrors.medications = 'Please add at least one medication';
        }
        break;
      case 'surgery':
        if (data.hasSurgery === 'Yes' && data.surgeryDetails.length === 0) {
          newErrors.surgery = 'Please add at least one surgery detail';
        }
        break;
      case 'healthGoals':
        if (data.healthGoals.length === 0) {
          newErrors.healthGoals = 'Please select at least one health goal';
        }
        break;
      case 'dietType':
        if (!data.dietType) {
          newErrors.dietType = 'Please select a diet type';
        }
        break;
      case 'bloodGroup':
        if (!data.bloodGroup) {
          newErrors.bloodGroup = 'Please select your blood group';
        }
        break;
      case 'mealTimings':
        if (!data.breakfastTime || !data.lunchTime || !data.dinnerTime) {
          newErrors.mealTimings = 'Please set all meal timings';
        }
        break;
      case 'workoutTime':
        if (!data.workoutTime) {
          newErrors.workoutTime = 'Please select your preferred workout time';
        }
        break;
      case 'routineFlexibility':
        // Flexibility slider has default value, no validation needed
        break;
      case 'wearable':
        if (!data.usesWearable) {
          newErrors.wearable = 'Please select if you use a wearable device';
        } else if (data.usesWearable === 'Yes' && !data.wearableType) {
          newErrors.wearable = 'Please select your wearable device type';
        }
        break;
      case 'trackFamily':
        if (!data.trackFamily) {
          newErrors.trackFamily = 'Please select yes or no';
        }
        break;
      case 'shareProgress':
        if (!data.shareProgress) {
          newErrors.shareProgress = 'Please select yes or no';
        }
        break;
      case 'emergencyContact':
        if (!data.emergencyContactName.trim() || !data.emergencyContactPhone.trim()) {
          newErrors.emergencyContact = 'Please provide emergency contact name and phone number';
        }
        break;
      case 'criticalConditions':
        // Critical conditions are optional, no validation needed
        break;
      case 'healthReports':
        // Health reports are optional, no validation needed
        break;
      case 'referralCode':
        // Referral code is optional, no validation needed
        break;
      case 'auth':
        // Auth step doesn't need validation, handled by AuthOptions component
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Calculate age when completing date of birth step
      if (steps[currentStep].id === 'dateOfBirth') {
        const calculatedAge = calculateAge(data.birthMonth, data.birthDay, data.birthYear);
        setData(prev => ({ ...prev, age: calculatedAge }));
      }

      // Convert units when completing height/weight step
      if (steps[currentStep].id === 'heightWeight') {
        const updatedData = { ...data };
        
        if (data.unitSystem === 'imperial') {
          // Convert imperial to metric
          const totalInches = parseInt(data.heightFeet) * 12 + parseInt(data.heightInches);
          const heightCm = Math.round(totalInches * 2.54);
          const weightKg = Math.round(parseInt(data.weightLb) * 0.453592);
          
          updatedData.heightCm = heightCm.toString();
          updatedData.weightKg = weightKg.toString();
        } else {
          // Convert metric to imperial
          const totalInches = Math.round(parseInt(data.heightCm) / 2.54);
          const feet = Math.floor(totalInches / 12);
          const inches = totalInches % 12;
          const weightLb = Math.round(parseInt(data.weightKg) / 0.453592);
          
          updatedData.heightFeet = feet.toString();
          updatedData.heightInches = inches.toString();
          updatedData.weightLb = weightLb.toString();
        }
        
        setData(updatedData);
      }
      
      if (currentStep === steps.length - 1) {
        // For auth step, don't auto-complete - let AuthOptions handle completion
        if (steps[currentStep].id === 'auth') {
          // The AuthOptions component will handle completion
          return;
        }
        
        // Ensure age is calculated before completing
        const finalData = { ...data };
        if (finalData.birthMonth && finalData.birthDay && finalData.birthYear) {
          finalData.age = calculateAge(finalData.birthMonth, finalData.birthDay, finalData.birthYear);
        }
        (async () => {
          const { data: inserted, error } = await supabase
            .from('onboarding_submissions')
            .insert([{ ...finalData, user_id: null }])
            .select('id');
          if (!error && inserted && inserted[0]?.id) {
            localStorage.setItem('onboardingRowId', inserted[0].id);
          }
          onComplete(finalData);
        })();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    } else {
      onBack();
    }
  };

  const updateData = (field: keyof OnboardingData, value: string | string[] | number) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing/selecting
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleChronicConditionToggle = (condition: string) => {
    const newConditions = [...data.chronicConditions];
    const isSelected = newConditions.includes(condition);
    const isNoneOption = condition === 'None of the above';
    
    if (isNoneOption) {
      // If clicking "None of the above", clear all others or clear everything
      if (isSelected) {
        updateData('chronicConditions', []);
      } else {
        updateData('chronicConditions', [condition]);
      }
    } else {
      // If clicking any other condition
      if (isSelected) {
        // Remove the condition
        const filtered = newConditions.filter(c => c !== condition);
        updateData('chronicConditions', filtered);
      } else {
        // Add the condition and remove "None of the above" if present
        const filtered = newConditions.filter(c => c !== 'None of the above');
        filtered.push(condition);
        updateData('chronicConditions', filtered);
      }
    }
  };

  const addMedication = (medication: string) => {
    if (medication.trim() && !data.medications.includes(medication.trim())) {
      const newMedications = [...data.medications, medication.trim()];
      updateData('medications', newMedications);
    }
  };

  const removeMedication = (medicationToRemove: string) => {
    const filtered = data.medications.filter(med => med !== medicationToRemove);
    updateData('medications', filtered);
  };

  const addSurgeryDetail = (surgeryDetail: string) => {
    if (surgeryDetail.trim() && !data.surgeryDetails.includes(surgeryDetail.trim())) {
      const newSurgeryDetails = [...data.surgeryDetails, surgeryDetail.trim()];
      updateData('surgeryDetails', newSurgeryDetails);
    }
  };

  const removeSurgeryDetail = (surgeryDetailToRemove: string) => {
    const filtered = data.surgeryDetails.filter(detail => detail !== surgeryDetailToRemove);
    updateData('surgeryDetails', filtered);
  };

  const handleHealthGoalToggle = (goal: string) => {
    const newGoals = [...data.healthGoals];
    const isSelected = newGoals.includes(goal);
    
    if (isSelected) {
      // Remove the goal
      const filtered = newGoals.filter(g => g !== goal);
      updateData('healthGoals', filtered);
    } else {
      // Add the goal
      newGoals.push(goal);
      updateData('healthGoals', newGoals);
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStepData.type) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-5xl mb-6"
            >
              👋
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-3"
            >
              <h1 className="text-2xl font-semibold text-gray-900">
                Nice to meet you, {data.fullName}!
              </h1>
              <p className="text-base text-gray-600 leading-relaxed px-4">
                UrCare is your health companion, helping you track fitness, nutrition, and sleep.
              </p>
            </motion.div>
          </div>
        );

      case 'dateOfBirth':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            {data.birthMonth && data.birthDay && data.birthYear && (
              <p className="text-sm text-gray-600 text-center px-4">
                So you are {calculateAge(data.birthMonth, data.birthDay, data.birthYear)} years old.
              </p>
            )}
            <div className="flex justify-center items-center space-x-4 max-w-sm w-full px-4">
              <div className="text-center flex flex-col items-center flex-1 min-w-0">
                <WheelPicker
                  options={getMonths()}
                  selectedValue={data.birthMonth}
                  onValueChange={(value) => updateData('birthMonth', value)}
                  width="w-full"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">Month</p>
              </div>
              <div className="text-center flex flex-col items-center flex-shrink-0 w-16">
                <WheelPicker
                  options={getDays()}
                  selectedValue={data.birthDay}
                  onValueChange={(value) => updateData('birthDay', value)}
                  width="w-full"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">Day</p>
              </div>
              <div className="text-center flex flex-col items-center flex-shrink-0 w-20">
                <WheelPicker
                  options={getYears()}
                  selectedValue={data.birthYear}
                  onValueChange={(value) => updateData('birthYear', value)}
                  width="w-full"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">Year</p>
              </div>
            </div>
            {errors.dateOfBirth && (
              <p className="text-red-500 text-sm text-center mt-4">{errors.dateOfBirth}</p>
            )}
          </div>
        );

      case 'sleepSchedule':
        const sleepDuration = calculateSleepDuration(data.sleepTime, data.wakeUpTime);
        const isGoodSleep = sleepDuration && sleepDuration.totalHours >= 7 && sleepDuration.totalHours <= 9;
        
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center px-4">
              What are your sleep and wake times?
            </p>
            <div className="space-y-4">
              <div className="text-center">
                <Label htmlFor="wakeUpTime" className="text-base font-medium text-gray-700 mb-2 block">Wake-up time</Label>
                <Input
                  id="wakeUpTime"
                  type="time"
                  value={data.wakeUpTime}
                  onChange={(e) => updateData('wakeUpTime', e.target.value)}
                  className="text-center text-xl font-normal border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto"
                  style={{ boxShadow: 'none' }}
                />
                <div className="w-full h-px bg-gray-200 mt-2"></div>
              </div>
              <div className="text-center">
                <Label htmlFor="sleepTime" className="text-base font-medium text-gray-700 mb-2 block">Sleep time</Label>
                <Input
                  id="sleepTime"
                  type="time"
                  value={data.sleepTime}
                  onChange={(e) => updateData('sleepTime', e.target.value)}
                  className="text-center text-xl font-normal border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto"
                  style={{ boxShadow: 'none' }}
                />
                <div className="w-full h-px bg-gray-200 mt-2"></div>
              </div>
            </div>
            
            {/* Sleep Duration and Encouragement Message */}
            {sleepDuration && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Sleep duration: {sleepDuration.hours}h {sleepDuration.minutes}m
                </p>
                <p className={`text-sm font-medium ${isGoodSleep ? 'text-green-600' : 'text-amber-600'}`}>
                  {isGoodSleep 
                    ? "You are taking good hours of sleep as required! 🌙😴"
                    : "Try to adjust for better sleep! 🌟🕒"
                  }
                </p>
              </div>
            )}
            
            {errors.sleepSchedule && (
              <p className="text-red-500 text-sm text-center">{errors.sleepSchedule}</p>
            )}
          </div>
        );

      case 'multiChoice':
        return (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {getChronicConditions().map((condition, index) => {
              const isSelected = data.chronicConditions.includes(condition);
              const isNoneSelected = data.chronicConditions.includes('None of the above');
              const isNoneOption = condition === 'None of the above';
              
              return (
                <motion.button
                  key={condition}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  } ${(isNoneSelected && !isNoneOption) ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleChronicConditionToggle(condition)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{condition}</span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
            {errors.chronicConditions && (
              <p className="text-red-500 text-sm text-center mt-2">{errors.chronicConditions}</p>
            )}
          </div>
        );

      case 'medications':
        return (
          <div className="space-y-6">
            {/* Yes/No Selection */}
            <div className="space-y-3">
              {['Yes', 'No'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all duration-300 ${
                    data.takesMedications === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    updateData('takesMedications', option);
                    // Clear medications if switching to No
                    if (option === 'No') {
                      updateData('medications', []);
                    }
                  }}
                >
                  <span className="text-lg font-medium">{option}</span>
                </motion.button>
              ))}
            </div>

            {/* Medication Input - Show only if Yes is selected */}
            {data.takesMedications === 'Yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Add Medication Input */}
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <Input
                      id="medicationInput"
                      type="text"
                      placeholder="Enter medication name"
                      className="flex-1 text-base border-gray-200 rounded-xl focus:ring-gray-900 focus:border-gray-900"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          addMedication(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('medicationInput') as HTMLInputElement;
                        if (input?.value) {
                          addMedication(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 rounded-xl"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Added Medications List */}
                  {data.medications.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium">Added medications:</p>
                      <div className="space-y-2">
                        {data.medications.map((medication, index) => (
                          <motion.div
                            key={medication}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <span className="text-gray-900 font-medium">{medication}</span>
                            <button
                              onClick={() => removeMedication(medication)}
                              className="text-red-500 hover:text-red-700 font-bold text-lg w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                            >
                              ×
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {errors.medications && (
              <p className="text-red-500 text-sm text-center">{errors.medications}</p>
            )}
          </div>
        );

      case 'surgery':
        return (
          <div className="space-y-6">
            {/* Yes/No Selection */}
            <div className="space-y-3">
              {['Yes', 'No'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all duration-300 ${
                    data.hasSurgery === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    updateData('hasSurgery', option);
                    // Clear surgery details if switching to No
                    if (option === 'No') {
                      updateData('surgeryDetails', []);
                    }
                  }}
                >
                  <span className="text-lg font-medium">{option}</span>
                </motion.button>
              ))}
            </div>

            {/* Surgery Details Input - Show only if Yes is selected */}
            {data.hasSurgery === 'Yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Add Surgery Detail Input */}
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <Input
                      id="surgeryInput"
                      type="text"
                      placeholder="Enter surgery or transplant details"
                      className="flex-1 text-base border-gray-200 rounded-xl focus:ring-gray-900 focus:border-gray-900"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          addSurgeryDetail(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('surgeryInput') as HTMLInputElement;
                        if (input?.value) {
                          addSurgeryDetail(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-gray-900 hover:bg-gray-800 text-white px-6 rounded-xl"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Added Surgery Details List */}
                  {data.surgeryDetails.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium">Added surgery details:</p>
                      <div className="space-y-2">
                        {data.surgeryDetails.map((surgeryDetail, index) => (
                          <motion.div
                            key={surgeryDetail}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <span className="text-gray-900 font-medium">{surgeryDetail}</span>
                            <button
                              onClick={() => removeSurgeryDetail(surgeryDetail)}
                              className="text-red-500 hover:text-red-700 font-bold text-lg w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                            >
                              ×
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {errors.surgery && (
              <p className="text-red-500 text-sm text-center">{errors.surgery}</p>
            )}
          </div>
        );

      case 'healthGoals':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center px-4">
              Select all that apply to customize your health plan.
            </p>
            <div className="space-y-2">
              {getHealthGoals().map((goal, index) => {
                const isSelected = data.healthGoals.includes(goal);
                
                return (
                  <motion.button
                    key={goal}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-300 ${
                      isSelected 
                        ? 'border-gray-900 bg-gray-900 text-white' 
                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                    }`}
                    onClick={() => handleHealthGoalToggle(goal)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{goal}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {errors.healthGoals && (
              <p className="text-red-500 text-sm text-center mt-2">{errors.healthGoals}</p>
            )}
          </div>
        );

      case 'dietChoice':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              What type of diet do you prefer?
            </p>
            <div className="space-y-3">
              {['Balanced', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Other'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all duration-300 ${
                    data.dietType === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => updateData('dietType', option)}
                >
                  <span className="text-lg font-medium">{option}</span>
                </motion.button>
              ))}
            </div>
            {errors.dietType && (
              <p className="text-red-500 text-sm text-center mt-4">{errors.dietType}</p>
            )}
          </div>
        );

      case 'bloodGroup':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center px-4">
              What's your blood group?
            </p>
            <div className="space-y-2">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-300 ${
                    data.bloodGroup === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => updateData('bloodGroup', option)}
                >
                  <span className="text-base font-medium">{option}</span>
                </motion.button>
              ))}
            </div>
            {errors.bloodGroup && (
              <p className="text-red-500 text-sm text-center mt-2">{errors.bloodGroup}</p>
            )}
          </div>
        );

      case 'mealTimings':
        return (
          <div className="flex flex-col justify-center space-y-6">
            <div className="text-center">
              <p className="text-base text-gray-600 font-medium mb-1">
                What are your usual meal times?
              </p>
              <p className="text-xs text-gray-500">
                Set your preferred dining schedule
              </p>
            </div>
            
            <div className="flex flex-col justify-center space-y-6 px-4">
              {/* Breakfast */}
              <div className="text-center">
                <Label htmlFor="breakfastTime" className="text-lg font-bold text-gray-900 mb-3 block">
                  🌅 Breakfast
                </Label>
                <Input
                  id="breakfastTime"
                  type="time"
                  value={data.breakfastTime}
                  onChange={(e) => updateData('breakfastTime', e.target.value)}
                  className="text-center text-xl font-medium border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto w-full"
                  style={{ boxShadow: 'none' }}
                />
                <div className="w-full h-px bg-gray-300 mt-2 rounded-full"></div>
              </div>

              {/* Lunch */}
              <div className="text-center">
                <Label htmlFor="lunchTime" className="text-lg font-bold text-gray-900 mb-3 block">
                  ☀️ Lunch
                </Label>
                <Input
                  id="lunchTime"
                  type="time"
                  value={data.lunchTime}
                  onChange={(e) => updateData('lunchTime', e.target.value)}
                  className="text-center text-xl font-medium border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto w-full"
                  style={{ boxShadow: 'none' }}
                />
                <div className="w-full h-px bg-gray-300 mt-2 rounded-full"></div>
              </div>

              {/* Dinner */}
              <div className="text-center">
                <Label htmlFor="dinnerTime" className="text-lg font-bold text-gray-900 mb-3 block">
                  🌙 Dinner
                </Label>
                <Input
                  id="dinnerTime"
                  type="time"
                  value={data.dinnerTime}
                  onChange={(e) => updateData('dinnerTime', e.target.value)}
                  className="text-center text-xl font-medium border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto w-full"
                  style={{ boxShadow: 'none' }}
                />
                <div className="w-full h-px bg-gray-300 mt-2 rounded-full"></div>
              </div>
            </div>

            {errors.mealTimings && (
              <p className="text-red-500 text-sm text-center font-medium">{errors.mealTimings}</p>
            )}
          </div>
        );

      case 'workoutChoice':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              What time do you prefer for your workouts?
            </p>
            <div className="space-y-3">
              {['Morning (06:00-10:00)', 'Afternoon (10:00-14:00)', 'Evening (14:00-18:00)', 'Night (18:00-22:00)', 'Anytime'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all duration-300 ${
                    data.workoutTime === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => updateData('workoutTime', option)}
                >
                  <span className="text-lg font-medium">{option}</span>
                </motion.button>
              ))}
            </div>
            {errors.workoutTime && (
              <p className="text-red-500 text-sm text-center mt-4">{errors.workoutTime}</p>
            )}
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              How flexible is your daily routine?
            </p>
            <div className="px-4">
              <div className="text-center mb-6">
                <div className="text-3xl font-semibold text-gray-900 mb-2">
                  {data.routineFlexibility || '5'}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Fixed</span>
                  <span>Flexible</span>
                </div>
              </div>
              <div className="relative">
                {/* Gradient overlays for fade effect */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10"></div>
                
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={data.routineFlexibility || '5'}
                  onChange={(e) => updateData('routineFlexibility', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider relative z-5"
                />
              </div>
            </div>
            {errors.routineFlexibility && (
              <p className="text-red-500 text-sm text-center mt-4">{errors.routineFlexibility}</p>
            )}
          </div>
        );

      case 'wearable':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              Do you use a smartwatch or fitness band?
            </p>
            <div className="space-y-3">
              {['Yes', 'No'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all duration-300 ${
                    data.usesWearable === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    updateData('usesWearable', option);
                    // Clear wearable type if switching to No
                    if (option === 'No') {
                      updateData('wearableType', '');
                    }
                  }}
                >
                  <span className="text-lg font-medium">{option}</span>
                </motion.button>
              ))}
            </div>

            {/* Wearable Type Selection - Show only if Yes is selected */}
            {data.usesWearable === 'Yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <p className="text-sm text-gray-600 font-medium text-center">Which device do you use?</p>
                <div className="space-y-3">
                  {['Apple Watch', 'Fitbit', 'Mi Band', 'Samsung Galaxy Watch', 'Garmin', 'Other'].map((device, index) => (
                    <motion.button
                      key={device}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-300 ${
                        data.wearableType === device 
                          ? 'border-gray-900 bg-gray-900 text-white' 
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                      }`}
                      onClick={() => updateData('wearableType', device)}
                    >
                      <span className="text-base font-medium">{device}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {errors.wearable && (
              <p className="text-red-500 text-sm text-center mt-4">{errors.wearable}</p>
            )}
          </div>
        );

      case 'yesNoChoice':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              {currentStepData.id === 'shareProgress' 
                ? 'Would you like to share your health progress with family?'
                : currentStepData.title}
            </p>
            <div className="space-y-3">
              {['Yes', 'No'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all duration-300 ${
                    (currentStepData.id === 'shareProgress' ? data.shareProgress : data.trackFamily) === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (currentStepData.id === 'shareProgress') {
                      updateData('shareProgress', option);
                    } else {
                      updateData('trackFamily', option);
                    }
                  }}
                >
                  <span className="text-lg font-medium">{option}</span>
                </motion.button>
              ))}
            </div>
            {(currentStepData.id === 'shareProgress' ? errors.shareProgress : errors.trackFamily) && (
              <p className="text-red-500 text-sm text-center mt-4">
                {currentStepData.id === 'shareProgress' ? errors.shareProgress : errors.trackFamily}
              </p>
            )}
          </div>
        );

      case 'emergencyContact':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              Who is your emergency contact person?
            </p>
            <div className="space-y-3">
              <Input
                id="emergencyContactName"
                type="text"
                value={data.emergencyContactName}
                onChange={(e) => updateData('emergencyContactName', e.target.value)}
                placeholder="Name"
                className="text-center text-base border-gray-200 rounded-xl focus:ring-gray-900 focus:border-gray-900"
              />
              <Input
                id="emergencyContactPhone"
                type="tel"
                value={data.emergencyContactPhone}
                onChange={(e) => updateData('emergencyContactPhone', e.target.value)}
                placeholder="Phone Number (e.g., +1234567890)"
                className="text-center text-base border-gray-200 rounded-xl focus:ring-gray-900 focus:border-gray-900"
              />
              {errors.emergencyContact && (
                <p className="text-red-500 text-sm text-center mt-4">{errors.emergencyContact}</p>
              )}
            </div>
          </div>
        );

      case 'textArea':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              List any known allergies or critical conditions.
            </p>
            <div className="space-y-3">
              <Input
                id="criticalConditionsInput"
                type="text"
                value={data.criticalConditions}
                onChange={(e) => updateData('criticalConditions', e.target.value)}
                placeholder="e.g., asthma, diabetes, allergies"
                className="text-center text-base border-gray-200 rounded-xl focus:ring-gray-900 focus:border-gray-900"
              />
              {errors.criticalConditions && (
                <p className="text-red-500 text-sm text-center mt-4">{errors.criticalConditions}</p>
              )}
            </div>
          </div>
        );

      case 'fileUpload':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center px-4">
              Do you have any existing health reports (e.g., doctor's notes, test results) to upload?
            </p>
            <div className="space-y-3">
              {['Yes', 'No'].map((option, index) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all duration-300 ${
                    data.hasHealthReports === option 
                      ? 'border-gray-900 bg-gray-900 text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }`}
                  onClick={() => updateData('hasHealthReports', option)}
                >
                  <span className="text-lg font-medium">{option}</span>
                </motion.button>
              ))}
            </div>
            {data.hasHealthReports === 'Yes' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Add File Upload Input */}
                <div className="space-y-3">
                  <Label htmlFor="healthReportsFile" className="text-lg font-medium text-gray-700">
                    Upload your health reports (PDF, DOC, DOCX, JPG, PNG)
                  </Label>
                  <Input
                    id="healthReportsFile"
                    type="file"
                    accept=".pdf,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        // For simplicity, we'll just add the filename to the list
                        // In a real app, you'd upload the file to a backend
                        updateData('healthReports', [...data.healthReports, file.name]);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('healthReportsFile') as HTMLInputElement;
                      input.click();
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 rounded-xl"
                  >
                    Choose File
                  </Button>

                  {/* Added Health Reports List */}
                  {data.healthReports.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium">Added health reports:</p>
                      <div className="space-y-2">
                        {data.healthReports.map((report, index) => (
                          <motion.div
                            key={report}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <span className="text-gray-900 font-medium">{report}</span>
                            <button
                              onClick={() => updateData('healthReports', data.healthReports.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 font-bold text-lg w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                            >
                              ×
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {errors.healthReports && (
              <p className="text-red-500 text-sm text-center mt-4">{errors.healthReports}</p>
            )}
          </div>
        );

      case 'referralCode':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Enter referral code (optional)</h2>
              <p className="text-sm text-gray-500">You can skip this step</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  id="referralCodeInput"
                  type="text"
                  value={data.referralCode}
                  onChange={(e) => updateData('referralCode', e.target.value)}
                  placeholder="Referral Code"
                  className="text-base border-gray-200 rounded-xl focus:ring-gray-900 focus:border-gray-900 h-12"
                />
                {data.referralCode && (
                  <Button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-300 text-gray-600 px-4 py-1 rounded-full text-sm hover:bg-gray-400"
                    onClick={() => {
                      // Handle referral code submission
                      console.log('Referral code submitted:', data.referralCode);
                    }}
                  >
                    Submit
                  </Button>
                )}
              </div>
              {errors.referralCode && (
                <p className="text-red-500 text-sm text-center">{errors.referralCode}</p>
              )}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <Input
              id={currentStepData.id}
              type="text"
              value={data[currentStepData.id as keyof OnboardingData]}
              onChange={(e) => updateData(currentStepData.id as keyof OnboardingData, e.target.value)}
              placeholder=""
              className="text-center text-3xl font-normal border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400 p-0 h-auto"
              style={{ boxShadow: 'none' }}
              autoFocus
            />
            <div className="w-full h-px bg-gray-200 mt-2"></div>
            {errors[currentStepData.id] && (
              <p className="text-red-500 text-sm text-center mt-4">{errors[currentStepData.id]}</p>
            )}
          </div>
        );

      case 'choice':
        return (
          <div className="space-y-2">
            {['Male', 'Female', 'Other'].map((option, index) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`w-full p-3 text-left rounded-xl border-2 transition-all duration-300 ${
                  data.gender === option 
                    ? 'border-gray-900 bg-gray-900 text-white' 
                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                }`}
                onClick={() => updateData('gender', option)}
              >
                <span className="text-base font-medium">{option}</span>
              </motion.button>
            ))}
            {errors.gender && (
              <p className="text-red-500 text-sm text-center mt-2">{errors.gender}</p>
            )}
          </div>
        );

      case 'heightWeight':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center px-4">
              This will be used to calibrate your custom plan.
            </p>

            {/* Unit Toggle */}
            <div className="flex justify-center">
              <div className="relative flex items-center bg-gray-200 rounded-full p-1">
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    data.unitSystem === 'imperial' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                  onClick={() => updateData('unitSystem', 'imperial')}
                >
                  Imperial
                </button>
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    data.unitSystem === 'metric' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                  onClick={() => updateData('unitSystem', 'metric')}
                >
                  Metric
                </button>
              </div>
            </div>

            {/* Height and Weight Sections */}
            <div className="grid grid-cols-2 gap-4">
              {/* Height Section */}
              <div className="text-center flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Height</h3>
                {data.unitSystem === 'imperial' ? (
                  <div className="flex justify-center space-x-2">
                    <div className="text-center flex flex-col items-center">
                      <WheelPicker
                        options={getHeightFeet()}
                        selectedValue={data.heightFeet}
                        onValueChange={(value) => updateData('heightFeet', value)}
                        width="w-12"
                      />
                      <p className="text-xs text-gray-500 mt-1">ft</p>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <WheelPicker
                        options={getHeightInches()}
                        selectedValue={data.heightInches}
                        onValueChange={(value) => updateData('heightInches', value)}
                        width="w-12"
                      />
                      <p className="text-xs text-gray-500 mt-1">in</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center">
                    <WheelPicker
                      options={getHeightCm()}
                      selectedValue={data.heightCm}
                      onValueChange={(value) => updateData('heightCm', value)}
                      width="w-16"
                    />
                    <p className="text-xs text-gray-500 mt-1">cm</p>
                  </div>
                )}
              </div>

              {/* Weight Section */}
              <div className="text-center flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Weight</h3>
                <div className="text-center flex flex-col items-center">
                  <WheelPicker
                    options={data.unitSystem === 'imperial' ? getWeightLb() : getWeightKg()}
                    selectedValue={data.unitSystem === 'imperial' ? data.weightLb : data.weightKg}
                    onValueChange={(value) => updateData(data.unitSystem === 'imperial' ? 'weightLb' : 'weightKg', value)}
                    width="w-16"
                  />
                  <p className="text-xs text-gray-500 mt-1">{data.unitSystem === 'imperial' ? 'lb' : 'kg'}</p>
                </div>
              </div>
            </div>
            
            {errors.heightWeight && (
              <p className="text-red-500 text-sm text-center mt-2">{errors.heightWeight}</p>
            )}
          </div>
        );

      case 'time':
        return (
          <div className="space-y-2">
            <Input
              id={currentStepData.id}
              type="time"
              value={data[currentStepData.id as keyof OnboardingData]}
              onChange={(e) => updateData(currentStepData.id as keyof OnboardingData, e.target.value)}
              className="text-center text-2xl font-normal border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto"
              style={{ boxShadow: 'none' }}
              autoFocus
            />
            <div className="w-full h-px bg-gray-200 mt-2"></div>
            {errors[currentStepData.id] && (
              <p className="text-red-500 text-sm text-center mt-4">{errors[currentStepData.id]}</p>
            )}
          </div>
        );

      case 'timeRange':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <Label htmlFor="workStart" className="text-lg font-medium text-gray-700 mb-4 block">Start Time</Label>
                <Input
                  id="workStart"
                  type="time"
                  value={data.workStart}
                  onChange={(e) => updateData('workStart', e.target.value)}
                  className="text-center text-xl font-normal border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto"
                  style={{ boxShadow: 'none' }}
                />
                <div className="w-full h-px bg-gray-200 mt-2"></div>
              </div>
              <div className="text-center">
                <Label htmlFor="workEnd" className="text-lg font-medium text-gray-700 mb-4 block">End Time</Label>
                <Input
                  id="workEnd"
                  type="time"
                  value={data.workEnd}
                  onChange={(e) => updateData('workEnd', e.target.value)}
                  className="text-center text-xl font-normal border-none bg-transparent focus:ring-0 focus:outline-none text-gray-900 p-0 h-auto"
                  style={{ boxShadow: 'none' }}
                />
                <div className="w-full h-px bg-gray-200 mt-2"></div>
              </div>
            </div>
            {errors.workSchedule && (
              <p className="text-red-500 text-sm text-center">{errors.workSchedule}</p>
            )}
          </div>
        );

      case 'auth':
        return (
          <AuthOptions 
            onboardingData={data} 
            onAuthSuccess={() => onComplete(data)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with back button and progress */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Button>
        
        {/* Progress bar */}
        <div className="flex-1 mx-8">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-gray-800 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="w-10"></div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 pt-4">
        {/* Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-center"
        >
          {currentStepData.type !== 'welcome' && (
            <>
              <h1 className="text-xl font-normal text-gray-900 mb-2 leading-tight">
                {currentStepData.title}
              </h1>
            </>
          )}
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`flex-1 flex items-${currentStepData.type === 'welcome' ? 'center' : 'start'} justify-center`}
        >
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Continue Button - Hide for auth step */}
      {currentStepData.type !== 'auth' && (
        <div className="p-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleNext}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-8 rounded-2xl text-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}; 