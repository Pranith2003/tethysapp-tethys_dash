import { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { v4 as uuidv4 } from "uuid";

import { useMapCoordinates } from "components/contexts/MapCoordinates";

const GeoGloWSChart = ({ data: propData, layout: propLayout, config: propConfig }) => {
  const [plotData, setPlotData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mapCoordinates = useMapCoordinates();
  const latlng = mapCoordinates?.latlng;
  const requestId = useRef(uuidv4());
  const lastLatLng = useRef(null);

  // Helper to convert timestamps to ISO strings for Plotly
  const convertTimestamps = (dataObj) => {
    if (!dataObj?.data) return dataObj;
    const nextData = (dataObj.data ?? []).map((trace) => {
      const xs = Array.isArray(trace?.x) ? trace.x : [];
      const convertedX = xs.map((v) => {
        const ms = typeof v === "string" ? Number(v) : v;
        if (typeof ms === "number" && Number.isFinite(ms)) {
          return new Date(ms).toISOString();
        }
        return v;
      });
      return { ...trace, x: convertedX };
    });
    return { ...dataObj, data: nextData };
  };

  // Fetch new data when map coordinates change OR use props if no map coordinates
  useEffect(() => {
    const handleGeoGloWSUpdate = async () => {
      try {
        // If no map coordinates, using props if available
        if (!latlng) {
          if (propData && propLayout) {
            const converted = convertTimestamps({ data: propData, layout: propLayout });
            setPlotData(converted);
            setError(null);
            setIsLoading(false);
          }
          return;
        }

        const lon = latlng.lon ?? latlng.lng;
        if (lon === undefined || latlng.lat === undefined) {
          // Fall back to props if coordinates are invalid
          if (propData && propLayout) {
            const converted = convertTimestamps({ data: propData, layout: propLayout });
            setPlotData(converted);
            setError(null);
            setIsLoading(false);
          }
          return;
        }

        // Checking if coordinates actually changed
        const coordsKey = `${latlng.lat},${lon}`;
        if (lastLatLng.current === coordsKey && plotData && !isLoading) {
          return; // Already have data for these coordinates
        }
        lastLatLng.current = coordsKey;

        setIsLoading(true);
        setError(null);

        const args = {
          latitude: latlng.lat,
          longitude: lon,
          storage_type: "grace",
        };

        const response = await fetch(
          `/apps/tethysdash/visualizations/get/?source=geo_glo_ws&args=${encodeURIComponent(
            JSON.stringify(args)
          )}&requestId=${encodeURIComponent(requestId.current)}`
        );

        // If the upstream returns HTML (e.g., 502 page), `response.json()` will throw.
        const rawText = await response.text();
        let result;
        try {
          result = JSON.parse(rawText);
        } catch (e) {
          setPlotData(null);
          setError(rawText?.slice(0, 300) || "Non-JSON response from server.");
          setIsLoading(false);
          return;
        }

        if (!result?.success) {
          setPlotData(null);
          setError(result?.data?.error ?? "Failed to retrieve data");
          setIsLoading(false);
          return;
        }

        // Plotly date axis works best with ISO strings/Date objects.
        const converted = convertTimestamps(result.data);
        setPlotData(converted);
        setIsLoading(false);
      } catch (err) {
        setPlotData(null);
        setError(String(err));
        setIsLoading(false);
      }
    };

    handleGeoGloWSUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latlng]);

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          color: "#d32f2f",
          backgroundColor: "#ffebee",
          border: "1px solid #ef5350",
          borderRadius: "4px",
          margin: "0.5rem",
        }}
      >
        <strong>Error loading GeoGloWS data:</strong>
        <div style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>{error}</div>
        <div style={{ marginTop: "0.5rem", fontSize: "0.85em", color: "#666" }}>
          Try selecting a different location on the map.
        </div>
      </div>
    );
  }
  if (isLoading || !plotData) return <div>Loading...</div>;

  return (
    <Plot
      data={plotData.data}
      layout={plotData.layout}
      config={propConfig || { displayModeBar: true }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default GeoGloWSChart;
