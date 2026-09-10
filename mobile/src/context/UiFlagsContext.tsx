import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UiFlags {
  ready: boolean;
  onboarded: boolean;
  locationAsked: boolean;
  completeOnboarding: () => Promise<void>;
  markLocationAsked: () => Promise<void>;
}

const Ctx = createContext<UiFlags>({} as UiFlags);

export const UiFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [locationAsked, setLocationAsked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [o, l] = await Promise.all([
          AsyncStorage.getItem('onboarded'),
          AsyncStorage.getItem('locationAsked'),
        ]);
        setOnboarded(o === '1');
        setLocationAsked(l === '1');
      } catch {
        setOnboarded(true);
        setLocationAsked(true);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarded', '1');
    } catch {}
    setOnboarded(true);
  };
  const markLocationAsked = async () => {
    try {
      await AsyncStorage.setItem('locationAsked', '1');
    } catch {}
    setLocationAsked(true);
  };

  return (
    <Ctx.Provider value={{ ready, onboarded, locationAsked, completeOnboarding, markLocationAsked }}>
      {children}
    </Ctx.Provider>
  );
};

export const useUiFlags = () => useContext(Ctx);
