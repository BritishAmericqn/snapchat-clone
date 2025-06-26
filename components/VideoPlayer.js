import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VideoPlayer = ({ 
  source, 
  style, 
  showControls = true,
  autoPlay = false,
  isLooping = false,
  isMuted = true, // Default muted for better UX
  resizeMode = ResizeMode.COVER,
  onLoad,
  onError,
  onPlaybackStatusUpdate,
  shouldPlay,
  poster,
}) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.playAsync();
    }
  }, [autoPlay]);

  const handlePlaybackStatusUpdate = (playbackStatus) => {
    setStatus(playbackStatus);
    
    if (playbackStatus.isLoaded) {
      setIsLoading(false);
      setHasError(false);
    } else if (playbackStatus.error) {
      setIsLoading(false);
      setHasError(true);
      console.error('[VideoPlayer] Playback error:', playbackStatus.error);
    }

    // Call parent callback if provided
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(playbackStatus);
    }
  };

  const handleLoad = (loadStatus) => {
    setIsLoading(false);
    if (onLoad) {
      onLoad(loadStatus);
    }
  };

  const handleError = (error) => {
    setIsLoading(false);
    setHasError(true);
    console.error('[VideoPlayer] Load error:', error);
    
    if (onError) {
      onError(error);
    } else {
      Alert.alert('Video Error', 'Failed to load video');
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('[VideoPlayer] Play/pause error:', error);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.setStatusAsync({
        isMuted: !status.isMuted,
      });
    } catch (error) {
      console.error('[VideoPlayer] Mute toggle error:', error);
    }
  };

  const formatDuration = (millis) => {
    if (!millis) return '0:00';
    
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasError) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Ionicons name="videocam-off" size={40} color={Colors.gray} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={source}
        style={styles.video}
        resizeMode={resizeMode}
        shouldPlay={shouldPlay || autoPlay}
        isLooping={isLooping}
        isMuted={isMuted}
        onLoad={handleLoad}
        onError={handleError}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        usePoster={!!poster}
        posterSource={poster}
        useNativeControls={false} // We'll implement custom controls
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.snapYellow} />
        </View>
      )}

      {/* Custom Controls */}
      {showControls && !isLoading && (
        <View style={styles.controlsOverlay}>
          {/* Play/Pause Button */}
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Ionicons
              name={status.isPlaying ? 'pause' : 'play'}
              size={30}
              color={Colors.white}
            />
          </TouchableOpacity>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Duration */}
            {status.durationMillis && (
              <View style={styles.durationContainer}>
                <View style={styles.durationBadge}>
                  <Ionicons name="time" size={12} color={Colors.white} />
                  <Text style={styles.durationText}>
                    {formatDuration(status.durationMillis)}
                  </Text>
                </View>
              </View>
            )}

            {/* Mute Button */}
            <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
              <Ionicons
                name={status.isMuted ? 'volume-mute' : 'volume-high'}
                size={20}
                color={Colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: Colors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.darkGray,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  durationText: {
    color: Colors.white,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPlayer; 