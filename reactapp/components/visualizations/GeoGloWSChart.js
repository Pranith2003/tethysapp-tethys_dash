import PropTypes from "prop-types";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useMapCoordinates } from "components/contexts/MapCoordinates";
import createPlotlyComponent from "react-plotly.js/factory";
import Spinner from "react-bootstrap/Spinner";
import { useAnimation } from "components/contexts/AnimationContext";

const Plotly = require("plotly.js-strict-dist-min");
const Plot = createPlotlyComponent(Plotly);

/* ---------------- styled components ---------------- */

const StyledPlot = styled(Plot)`
  width: 100%;
  height: 100%;
  padding: 0;
  `;

  const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  `;
  
const StyledSpinner = styled(Spinner)`
  margin: auto;
  display: block;
`;

/* ---------------- component ---------------- */

const GeoGloWSChart = ({ data, layout, config, visualizationRef }) => {
  const { selectedRegion } = useAnimation();
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [storageType, setStorageType] = useState(null);

  const mapCoordinates = useMapCoordinates();
  const latlng = mapCoordinates?.latlng;

  const { width, height, ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 100,
  });

  console.log("selectedRegion", selectedRegion)
  /* ---------------- helpers ---------------- */

  const hasValidCoords =
    latlng &&
    typeof latlng.lat === "number" &&
    typeof latlng.lon === "number";

  const dynamicTitle =
    hasValidCoords && storageType
      ? `${storageType.toUpperCase()} Values for lat ${latlng.lat.toFixed(
          3
        )}, lon ${latlng.lon.toFixed(3)}`
      : "Select a location to view data";

  /* ---------------- data fetch ---------------- */

  useEffect(() => {
    if (!hasValidCoords) return;

    const handleGeoGloWSUpdate = async () => {
      setLoading(true);
      setPlotData(null);

      try {
        let requestedStorageType = "grace";
        const url = `http://ggst-api.geoglows.org/api/getPointValues?latitude=${latlng.lat}&longitude=${latlng.lon}&storage_type=${selectedRegion.storage_type}`;

        const response = await fetch(url);
        const result = await response.json();

        // ✅ backend contract check
        if (result.success !== "success") {
          throw new Error("Backend returned unsuccessful response");
        }

        if (!Array.isArray(result.values)) {
          throw new Error("Missing values in response");
        }

        const plotlyData = [
          {
            x: result.values.map(v => v[0]), // timestamps
            y: result.values.map(v => v[1]), // values
            type: "scatter",
            mode: "lines",
            name: requestedStorageType.toUpperCase(),
          },
        ];

        setStorageType(result.storage_type);
        setPlotData(plotlyData);
      } catch (err) {
        console.error("Error updating GeoGloWS data:", err);
      } finally {
        setLoading(false);
      }
    };

    handleGeoGloWSUpdate();
  }, [latlng, hasValidCoords]);

  /* ---------------- render ---------------- */

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      {!hasValidCoords ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Select coordinates to show the chart
        </div>
      ) : loading ? (
        <SpinnerContainer>
          <StyledSpinner animation="border" variant="info" />
        </SpinnerContainer>
      ) : (
        <StyledPlot
          ref={visualizationRef}
          data={plotData ?? data}
          layout={{
            ...layout,
            title: dynamicTitle,
            width,
            height,
          }}
          config={config}
        />
      )}
    </div>
  );
};

/* ---------------- prop types ---------------- */

GeoGloWSChart.propTypes = {
  data: PropTypes.array,
  layout: PropTypes.object,
  config: PropTypes.object,
  rowHeight: PropTypes.number,
  colWidth: PropTypes.number,
  visualizationRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
};

export default GeoGloWSChart;
