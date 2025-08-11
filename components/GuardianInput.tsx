import React, { useState } from 'react';
import { control } from './ui';
import { PhilippineAddressService, formatPhilippinePhone, validatePhilippinePhone } from '../services/philippineAddressService';

interface GuardianDetails {
  fullName?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  facebook?: string;
}

interface GuardianInputProps {
  guardianType: 'primary' | 'secondary';
  guardian?: GuardianDetails;
  onChange: (guardian: GuardianDetails) => void;
  onRemove?: () => void;
  disabled?: boolean;
  showRemoveButton?: boolean;
}

const RELATIONSHIP_OPTIONS = [
  'Mother',
  'Father',
  'Grandmother',
  'Grandfather',
  'Aunt',
  'Uncle',
  'Sister',
  'Brother',
  'Cousin',
  'Guardian',
  'Foster Parent',
  'Step-parent',
  'Other'
];

export const GuardianInput: React.FC<GuardianInputProps> = ({
  guardianType,
  guardian = {},
  onChange,
  onRemove,
  disabled = false,
  showRemoveButton = false
}) => {
  const [fullName, setFullName] = useState(guardian.fullName || '');
  const [relationship, setRelationship] = useState(guardian.relationship || '');
  const [phone, setPhone] = useState(guardian.phone || '');
  const [email, setEmail] = useState(guardian.email || '');
  const [facebook, setFacebook] = useState(guardian.facebook || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const inputClasses = control;
  const labelClasses = "block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1";

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    updateGuardian({ fullName: value });
  };

  const handleRelationshipChange = (value: string) => {
    setRelationship(value);
    updateGuardian({ relationship: value });
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setPhoneError(null);
    updateGuardian({ phone: value });
  };

  const handlePhoneBlur = () => {
    if (phone && !validatePhilippinePhone(phone)) {
      setPhoneError('Please enter a valid Philippine phone number');
    } else if (phone) {
      const formatted = formatPhilippinePhone(phone);
      setPhone(formatted);
      updateGuardian({ phone: formatted });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    updateGuardian({ email: value });
  };

  const handleFacebookChange = (value: string) => {
    setFacebook(value);
    updateGuardian({ facebook: value });
  };

  const updateGuardian = (updates: Partial<GuardianDetails>) => {
    const updatedGuardian = {
      fullName,
      relationship,
      phone,
      email,
      facebook,
      ...updates
    };
    onChange(updatedGuardian);
  };

  const isRequired = guardianType === 'primary';
  const titleLabel = guardianType === 'primary' ? 'Primary Guardian/Parent' : 'Secondary Guardian/Parent';

  return (
    <div className="space-y-4 p-4 border border-surface-border dark:border-slate-700 rounded-md">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-text-primary dark:text-slate-200">
          {titleLabel}
          {isRequired && <span className="text-status-red ml-1">*</span>}
        </h4>
        {showRemoveButton && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-status-red hover:bg-status-red/10 p-1 rounded-md transition-colors"
            disabled={disabled}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label htmlFor={`${guardianType}-fullName`} className={labelClasses}>
            Full Name {isRequired && <span className="text-status-red">*</span>}
          </label>
          <input
            type="text"
            id={`${guardianType}-fullName`}
            value={fullName}
            onChange={(e) => handleFullNameChange(e.target.value)}
            className={inputClasses}
            placeholder="e.g., Maria Santos"
            disabled={disabled}
            required={isRequired}
          />
        </div>

        {/* Relationship */}
        <div>
          <label htmlFor={`${guardianType}-relationship`} className={labelClasses}>
            Relationship {isRequired && <span className="text-status-red">*</span>}
          </label>
          <select
            id={`${guardianType}-relationship`}
            value={relationship}
            onChange={(e) => handleRelationshipChange(e.target.value)}
            className={inputClasses}
            disabled={disabled}
            required={isRequired}
          >
            <option value="">Select relationship...</option>
            {RELATIONSHIP_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor={`${guardianType}-phone`} className={labelClasses}>
            Phone Number {guardianType === 'primary' ? '(Optional)' : '(Optional)'}
          </label>
          <input
            type="tel"
            id={`${guardianType}-phone`}
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            className={`${inputClasses} ${phoneError ? 'border-status-red' : ''}`}
            placeholder="e.g., 0917 123 4567"
            disabled={disabled}
          />
          {phoneError && (
            <p className="text-xs text-status-red mt-1">{phoneError}</p>
          )}
          <p className="text-xs text-text-secondary dark:text-slate-400 mt-1">
            Philippine format: 09XX XXX XXXX or +63 9XX XXX XXXX
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor={`${guardianType}-email`} className={labelClasses}>
            Email Address (Optional)
          </label>
          <input
            type="email"
            id={`${guardianType}-email`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={inputClasses}
            placeholder="e.g., maria.santos@email.com"
            disabled={disabled}
          />
        </div>

        {/* Facebook */}
        <div className="md:col-span-2">
          <label htmlFor={`${guardianType}-facebook`} className={labelClasses}>
            Facebook Profile (Optional)
          </label>
          <input
            type="text"
            id={`${guardianType}-facebook`}
            value={facebook}
            onChange={(e) => handleFacebookChange(e.target.value)}
            className={inputClasses}
            placeholder="Facebook name or https://facebook.com/..."
            disabled={disabled}
          />
        </div>
      </div>

      {guardianType === 'primary' && (
        <div className="text-xs text-text-secondary dark:text-slate-400 bg-surface-subtle dark:bg-slate-800 p-3 rounded-md">
          <p className="font-medium mb-1">Primary Guardian Information:</p>
          <p>This person will be contacted in case of emergencies and is the primary point of contact for the student.</p>
        </div>
      )}
    </div>
  );
};

interface GuardianManagementProps {
  primaryGuardian?: GuardianDetails;
  secondaryGuardian?: GuardianDetails;
  onPrimaryGuardianChange: (guardian: GuardianDetails) => void;
  onSecondaryGuardianChange: (guardian: GuardianDetails | undefined) => void;
  disabled?: boolean;
  isMinor?: boolean;
}

export const GuardianManagement: React.FC<GuardianManagementProps> = ({
  primaryGuardian,
  secondaryGuardian,
  onPrimaryGuardianChange,
  onSecondaryGuardianChange,
  disabled = false,
  isMinor = false
}) => {
  const [showSecondaryGuardian, setShowSecondaryGuardian] = useState(!!secondaryGuardian);

  const handleAddSecondaryGuardian = () => {
    setShowSecondaryGuardian(true);
    onSecondaryGuardianChange({});
  };

  const handleRemoveSecondaryGuardian = () => {
    setShowSecondaryGuardian(false);
    onSecondaryGuardianChange(undefined);
  };

  return (
    <div className="space-y-6">
      {isMinor && (
        <div className="text-sm text-status-yellow bg-status-yellow-light dark:bg-status-yellow/20 px-3 py-2 rounded-md">
          <p className="font-medium">Minor Student Detected</p>
          <p>Guardian information is recommended for students under 18 years old.</p>
        </div>
      )}

      {/* Primary Guardian */}
      <GuardianInput
        guardianType="primary"
        guardian={primaryGuardian}
        onChange={onPrimaryGuardianChange}
        disabled={disabled}
      />

      {/* Secondary Guardian */}
      {showSecondaryGuardian ? (
        <GuardianInput
          guardianType="secondary"
          guardian={secondaryGuardian}
          onChange={onSecondaryGuardianChange}
          onRemove={handleRemoveSecondaryGuardian}
          disabled={disabled}
          showRemoveButton={true}
        />
      ) : (
        <div className="text-center">
          <button
            type="button"
            onClick={handleAddSecondaryGuardian}
            className="px-4 py-2 bg-surface-main dark:bg-slate-700 border border-surface-border dark:border-slate-600 rounded-md text-text-primary dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            disabled={disabled}
          >
            + Add Secondary Guardian/Parent
          </button>
          <p className="text-xs text-text-secondary dark:text-slate-400 mt-2">
            Optional: Add a second emergency contact
          </p>
        </div>
      )}
    </div>
  );
};
