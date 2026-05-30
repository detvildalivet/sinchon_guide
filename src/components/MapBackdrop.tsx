import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { homeCategoryPins } from '../design/homeMapPins';
import { theme } from '../design/theme';

type Props = {
  variant?: 'together' | 'solo';
  layout?: 'home' | 'detail';
};

const homeBlocks = [
  { pin: homeCategoryPins[0], width: 96, height: 68, rotate: '-8deg', marginTop: -34, marginLeft: -48 },
  { pin: homeCategoryPins[1], width: 88, height: 72, rotate: '10deg', marginTop: -36, marginLeft: -44 },
  { pin: homeCategoryPins[2], width: 92, height: 64, rotate: '-6deg', marginTop: -32, marginLeft: -46 },
] as const;

export function MapBackdrop({
  variant = 'together',
  layout = 'detail',
}: Props) {
  const solo = variant === 'solo';
  const home = layout === 'home';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.mapLayer,
        solo ? styles.mapLayerSolo : styles.mapLayerTogether,
      ]}>
      {home ? (
        <>
          {homeCategoryPins.map(pin => (
            <React.Fragment key={`road-${pin.id}`}>
              <View
                style={[
                  styles.mapRoad,
                  styles.homeRoadHorizontal,
                  { top: `${pin.top}%`, marginTop: -11 },
                  solo && styles.roadSolo,
                ]}
              />
              <View
                style={[
                  styles.mapRoad,
                  styles.homeRoadVertical,
                  { left: `${pin.left}%`, marginLeft: -11 },
                  solo && styles.roadSolo,
                ]}
              />
            </React.Fragment>
          ))}
          {homeBlocks.map(block => (
            <View
              key={`block-${block.pin.id}`}
              style={[
                styles.block,
                styles.homeBlock,
                {
                  top: `${block.pin.top}%`,
                  left: `${block.pin.left}%`,
                  width: block.width,
                  height: block.height,
                  marginTop: block.marginTop,
                  marginLeft: block.marginLeft,
                  transform: [{ rotate: block.rotate }],
                },
                solo && styles.blockSolo,
              ]}
            />
          ))}
        </>
      ) : (
        <>
          <View style={[styles.mapRoad, styles.roadOne, solo && styles.roadSolo]} />
          <View style={[styles.mapRoad, styles.roadTwo, solo && styles.roadSolo]} />
          <View style={[styles.mapRoad, styles.roadThree, solo && styles.roadSolo]} />
          <View style={[styles.mapRoad, styles.roadFour, solo && styles.roadSolo]} />
          <View style={[styles.mapRoad, styles.roadFive, solo && styles.roadSolo]} />
          <View style={[styles.block, styles.blockOne, solo && styles.blockSolo]} />
          <View style={[styles.block, styles.blockTwo, solo && styles.blockSolo]} />
          <View style={[styles.block, styles.blockThree, solo && styles.blockSolo]} />
          <View style={[styles.block, styles.blockFour, solo && styles.blockSolo]} />
          <View style={[styles.block, styles.blockFive, solo && styles.blockSolo]} />
        </>
      )}
      <Text style={[styles.mapLabel, styles.mapLabelOne, solo && styles.labelSolo]}>
        Seoul St.
      </Text>
      <Text style={[styles.mapLabel, styles.mapLabelTwo, solo && styles.labelSolo]}>
        Table Ave.
      </Text>
      <View style={[styles.mapVeil, solo ? styles.veilSolo : styles.veilTogether]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mapLayer: {
    ...StyleSheet.absoluteFill,
  },
  mapLayerTogether: {
    backgroundColor: '#C5D8F2',
  },
  mapLayerSolo: {
    backgroundColor: '#0B2F73',
  },
  mapVeil: {
    ...StyleSheet.absoluteFill,
  },
  veilTogether: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  veilSolo: {
    backgroundColor: 'rgba(8, 23, 65, 0.22)',
  },
  mapRoad: {
    position: 'absolute',
    borderRadius: theme.radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 76, 207, 0.22)',
  },
  roadSolo: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderColor: 'rgba(255, 216, 77, 0.28)',
  },
  homeRoadHorizontal: {
    width: '108%',
    height: 22,
    left: '-4%',
    transform: [{ rotate: '-10deg' }],
  },
  homeRoadVertical: {
    width: 22,
    height: '112%',
    top: '-6%',
    transform: [{ rotate: '8deg' }],
  },
  homeBlock: {
    position: 'absolute',
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(15, 76, 207, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 76, 207, 0.28)',
  },
  roadOne: {
    width: '112%',
    height: 20,
    top: '30%',
    left: '-8%',
    transform: [{ rotate: '-18deg' }],
  },
  roadTwo: {
    width: '96%',
    height: 20,
    top: '60%',
    left: '4%',
    transform: [{ rotate: '22deg' }],
  },
  roadThree: {
    width: '88%',
    height: 20,
    top: '47%',
    left: '12%',
    transform: [{ rotate: '88deg' }],
  },
  roadFour: {
    width: '70%',
    height: 20,
    top: '76%',
    left: '-10%',
    transform: [{ rotate: '-8deg' }],
  },
  roadFive: {
    width: '92%',
    height: 20,
    bottom: '10%',
    left: '8%',
    transform: [{ rotate: '-24deg' }],
  },
  block: {
    position: 'absolute',
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(15, 76, 207, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15, 76, 207, 0.12)',
  },
  blockSolo: {
    backgroundColor: 'rgba(255, 216, 77, 0.14)',
    borderColor: 'rgba(255, 216, 77, 0.22)',
  },
  blockOne: {
    width: 132,
    height: 96,
    top: '18%',
    left: '7%',
    transform: [{ rotate: '-12deg' }],
  },
  blockTwo: {
    width: 124,
    height: 140,
    top: '26%',
    right: '-4%',
    transform: [{ rotate: '15deg' }],
  },
  blockThree: {
    width: 148,
    height: 104,
    bottom: '22%',
    left: '4%',
    transform: [{ rotate: '12deg' }],
  },
  blockFour: {
    width: 120,
    height: 120,
    bottom: '9%',
    right: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  blockFive: {
    width: 128,
    height: 92,
    bottom: '16%',
    left: '52%',
    transform: [{ rotate: '8deg' }],
  },
  mapLabel: {
    position: 'absolute',
    color: 'rgba(15, 76, 207, 0.28)',
    fontSize: 12,
    fontWeight: '800',
  },
  labelSolo: {
    color: 'rgba(255, 216, 77, 0.32)',
  },
  mapLabelOne: {
    top: '36%',
    left: '12%',
    transform: [{ rotate: '-18deg' }],
  },
  mapLabelTwo: {
    bottom: '31%',
    right: '12%',
    transform: [{ rotate: '22deg' }],
  },
});
