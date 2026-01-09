import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import axios from "axios";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

const PlayerContainer = styled.div`
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 8px;
  z-index: 1001;
  display: flex;
  align-items: center;
  gap: 0px;
  min-width: 320px;
  max-width: 90vw;
  flex-wrap: wrap;
`;

const TimeSlider = styled.input`
  flex: 1 1 120px;
  min-width: 120px;
`;

const TimeDisplay = styled.span`
  font-family: monospace;
  font-size: 0.95em;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 0px 0px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2em;
  transition: background 0.2s;
  &:hover {
    background: #e0e0e0;
  }
`;

const ResetButton = styled(IconButton)`
  font-size: 1em;
  color: #1976d2;
`;

const StyledToastContainer = styled(ToastContainer)`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1100;
`;

// Function to fetch time steps from WMS GetCapabilities
async function fetchTimeStepsFromWMS(url) {
  try {
    const capabilitiesUrl = new URL(url);
    const params = new URLSearchParams(capabilitiesUrl.search);
    params.set("SERVICE", "WMS");
    params.set("VERSION", "1.3.0");
    params.set("REQUEST", "GetCapabilities");
    capabilitiesUrl.search = params.toString();

    const response = await axios.get(capabilitiesUrl.toString());
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "text/xml");

    const dimensions = xmlDoc.querySelectorAll('Dimension[name="time"]');
    if (dimensions.length === 0) return null;

    const timeText = dimensions[0].textContent.trim();
    if (!timeText) return null;

    if (timeText.includes("/")) {
      const [start, end, interval] = timeText.split("/");
      return generateTimeRange(start, end, interval);
    } else {
      return timeText.split(",").map((t) => t.trim());
    }
  } catch (error) {
    console.error("Error fetching WMS capabilities:", error);
    return null;
  }
}

// Generate time range from start/end/interval
function generateTimeRange(start, end, interval) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const result = [];

  const intervalValue = parseInt(interval.replace(/[^0-9]/g, ""));
  const intervalUnit = interval.replace(/[0-9]/g, "");

  let current = new Date(startDate);
  while (current <= endDate) {
    result.push(current.toISOString().split(".")[0] + "Z");

    if (intervalUnit.includes("D")) {
      current.setDate(current.getDate() + intervalValue);
    } else if (intervalUnit.includes("H")) {
      current.setHours(current.getHours() + intervalValue);
    } else if (intervalUnit.includes("M") && !intervalUnit.includes("T")) {
      current.setMonth(current.getMonth() + intervalValue);
    } else if (intervalUnit.includes("M") && intervalUnit.includes("T")) {
      current.setMinutes(current.getMinutes() + intervalValue);
    }
  }

  return result;
}

// Get time steps from layer config or generate them
function getTimeStepsFromConfig(layerConfig) {
  const props =
    layerConfig?.configuration?.props?.source?.props ||
    layerConfig?.props?.source?.props;
  console.log(props, "...119");
  if (!props) return null;

  const timeEnabled = props.TIME_ENABLED;
  console.log("Time Enabled:", timeEnabled);
  if (!timeEnabled) return null;
  console.log(props.TIME_VALUES);
  if (Array.isArray(props.TIME_VALUES)) {
    return props.TIME_VALUES;
  }

  if (props.TIME_START && props.TIME_END && props.TIME_INTERVAL) {
    const steps = [];
    let current = new Date(props.TIME_START);
    const end = new Date(props.TIME_END);

    let stepMs = 24 * 3600 * 1000;
    if (props.TIME_INTERVAL === "hourly") stepMs = 3600 * 1000;

    if (props.TIME_INTERVAL === "monthly") {
      while (current <= end) {
        steps.push(current.toISOString().split("T")[0]);
        current.setMonth(current.getMonth() + 1);
      }
      return steps;
    }

    while (current <= end) {
      steps.push(current.toISOString().split("T")[0]);
      current = new Date(current.getTime() + stepMs);
    }
    console.log(steps, "...steps");

    return steps;
  }

  return null;
}

const TimeSeriesControl = ({ layers, visualizationRef }) => {
  const timeLayer = layers?.find((layer) => {
    const typeCheck = layer?.type === "ImageLayer";

    const sourceCheck = layer?.props?.source?.type === "WMS";

    const timeCheck =
      layer?.props?.source?.props?.TIME_ENABLED ||
      layer?.configuration?.props?.source?.props?.TIME_ENABLED;
    console.log(typeCheck, sourceCheck, timeCheck);
    return typeCheck && sourceCheck && timeCheck;
  });

  const [timeSteps, setTimeSteps] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const playRef = useRef();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!timeLayer || !visualizationRef.current) return;

    if (layerRef.current === timeLayer) return;
    layerRef.current = timeLayer;

    async function initTimeSteps() {
      setLoading(true);

      let steps = getTimeStepsFromConfig(timeLayer);

      const props =
        timeLayer?.configuration?.props?.source?.props ||
        timeLayer?.props?.source?.props;
      console.log("Time Layer Props:", props);
      if (!steps && props.TIME_AUTO_FETCH) {
        const url = props.url;
        if (url) {
          try {
            const fetchedSteps = await fetchTimeStepsFromWMS(url);
            if (fetchedSteps && fetchedSteps.length > 0) {
              steps = fetchedSteps;
            } else {
              setToastMessage(
                "No time dimension found in WMS GetCapabilities. Check your WMS service."
              );
              setShowToast(true);
              setLoading(false);
              return;
            }
          } catch (error) {
            setToastMessage(
              "Failed to fetch time information from WMS. Check your connection and URL."
            );
            setShowToast(true);
            setLoading(false);
            return;
          }
        } else {
          setToastMessage("WMS URL is missing. Cannot fetch time information.");
          setShowToast(true);
          setLoading(false);
          return;
        }
      }

      if (
        !steps &&
        !props.TIME_AUTO_FETCH &&
        props.TIME_START &&
        props.TIME_END
      ) {
        steps = getTimeStepsFromConfig(timeLayer);
      }

      if (steps && steps.length > 0) {
        setTimeSteps(steps);
        setCurrentIdx(0);
      } else {
        setToastMessage("No time steps available. Check your time settings.");
        setShowToast(true);
      }

      setLoading(false);
    }

    initTimeSteps();
  }, [timeLayer, visualizationRef]);

  useEffect(() => {
    if (!timeLayer || !visualizationRef.current || timeSteps.length === 0)
      return;

    const mapLayers = visualizationRef.current.getLayers().getArray();
    const layerName =
      timeLayer?.configuration?.props?.name || timeLayer?.props?.name;

    mapLayers.forEach((olLayer) => {
      const source = olLayer.getSource?.();
      if (source && source.updateParams) {
        if (!layerName || olLayer.get("name") === layerName) {
          source.updateParams({ TIME: timeSteps[currentIdx] });
        }
      }
    });
  }, [currentIdx, timeLayer, timeSteps, visualizationRef]);

  useEffect(() => {
    if (isPlaying && timeSteps.length > 1) {
      playRef.current = setInterval(() => {
        setCurrentIdx((idx) => (idx + 1) % timeSteps.length);
      }, 1000);
    } else {
      clearInterval(playRef.current);
    }
    return () => clearInterval(playRef.current);
  }, [isPlaying, timeSteps.length]);

  if (!timeLayer || timeSteps.length === 0) {
    return (
      <StyledToastContainer position="top-end">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={5000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Time Series</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </StyledToastContainer>
    );
  }

  const jumpToFirst = () => setCurrentIdx(0);
  const jumpToLast = () => setCurrentIdx(timeSteps.length - 1);
  const stepBackward = () => setCurrentIdx((idx) => Math.max(idx - 1, 0));
  const stepForward = () =>
    setCurrentIdx((idx) => Math.min(idx + 1, timeSteps.length - 1));
  const handleSlider = (e) => setCurrentIdx(Number(e.target.value));
  const handleReset = () => {
    setCurrentIdx(0);
    setIsPlaying(false);
  };

  return (
    <>
      <StyledToastContainer position="top-end">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={5000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">Time Series</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </StyledToastContainer>

      <PlayerContainer>
        <TimeSlider
          type="range"
          min={0}
          max={timeSteps.length - 1}
          value={currentIdx}
          onChange={handleSlider}
        />
        <ResetButton title="Reset" onClick={handleReset}>
          🔄
        </ResetButton>
        {/* <IconButton title="First" onClick={jumpToFirst}>◀️</IconButton> */}
        <IconButton title="Back" onClick={stepBackward}>
          ⏮️
        </IconButton>
        <IconButton
          title={isPlaying ? "Pause" : "Play"}
          onClick={() => setIsPlaying((p) => !p)}
          disabled={loading}
        >
          {loading ? "⏳" : isPlaying ? "⏸️" : "▶️"}
        </IconButton>
        <IconButton title="Forward" onClick={stepForward}>
          ⏭️
        </IconButton>
        {/* <IconButton title="Last" onClick={jumpToLast}>▶️</IconButton> */}
        <TimeDisplay title="Current Time">{timeSteps[currentIdx]}</TimeDisplay>
      </PlayerContainer>
    </>
  );
};

TimeSeriesControl.propTypes = {
  layers: PropTypes.array,
  visualizationRef: PropTypes.shape({ current: PropTypes.any }),
};

export default TimeSeriesControl;
