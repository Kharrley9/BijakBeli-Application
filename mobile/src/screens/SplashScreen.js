// SplashScreen.js
// Page 1: Splash Screen — Logo, tagline, loading indicator

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation?.replace('Login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);
  
  return (
    <View className="flex-1 bg-brand items-center justify-center">
      <View className="items-center">
        <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-6">
          <ShoppingCart size={48} color="#ffffff" />
        </View>
        <Text className="text-5xl font-extrabold text-white mb-2">BijakBeli</Text>
        <Text className="text-white/80 text-center text-base leading-6">
          Smart Grocery{'\n'}Budget Comparison
        </Text>
      </View>

      <View className="absolute bottom-16 items-center flex-row space-x-2">
        <ActivityIndicator size="small" color="#ffffff" />
        <Text className="text-white/80 text-sm ml-2">Loading...</Text>
      </View>
    </View>
  );
}
