import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../config/theme';

export const GradientBackground = ({ 
  gradientType = 'darkSwirl', 
  style, 
  children,
  ...props 
}) => {
  const gradient = Gradients[gradientType] || Gradients.darkSwirl;
  
  return (
    <LinearGradient
      colors={gradient.colors}
      start={gradient.start}
      end={gradient.end}
      locations={gradient.locations}
      style={[styles.gradient, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
}); 