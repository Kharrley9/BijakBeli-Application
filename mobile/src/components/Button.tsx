import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  textClassName = '',
}: ButtonProps) => {
  const baseStyles = 'w-full py-4 rounded-xl flex-row justify-center items-center';
  
  const variantStyles = {
    primary: 'bg-brand',
    secondary: 'bg-slate-800',
    outline: 'bg-white border-2 border-slate-200',
  };

  const textStyles = {
    primary: 'text-white font-bold text-lg',
    secondary: 'text-white font-bold text-lg',
    outline: 'text-slate-800 font-bold text-lg',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50' : 'opacity-100'} ${className}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#059669' : '#ffffff'} />
      ) : (
        <Text className={`${textStyles[variant]} ${textClassName}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
