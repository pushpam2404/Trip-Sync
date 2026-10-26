interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
  mappls?: any;
}

declare module '@mapbox/polyline' {
  const polyline: {
    decode(str: string, precision?: number): [number, number][];
  };
  export default polyline;
}
