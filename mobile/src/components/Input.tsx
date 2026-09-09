import React, { useState } from 'react';
import { TextInput, View, Text, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const Input = ({ label, error, isPassword, className = '', ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View className={`w-full mb-4 ${className}`}>
      <Text className="text-slate-700 text-sm font-semibold mb-2 ml-1">{label}</Text>
      
      <View 
        className={`flex-row items-center w-full bg-white border-2 rounded-xl px-4 h-14 ${
          error ? 'border-red-500' : isFocused ? 'border-brand' : 'border-slate-200'
        }`}
      >
        <TextInput
          className="flex-1 text-slate-800 text-base"
          placeholderTextColor="#94a3b8"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            className="p-2"
          >
            {showPassword ? (
              <EyeOff size={20} color="#64748b" />
            ) : (
              <Eye size={20} color="#64748b" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
};
