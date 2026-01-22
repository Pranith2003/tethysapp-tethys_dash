import { useEffect, useState } from "react";
import Plot from "react-plotly.js";

import { useMapCoordinates } from "components/contexts/MapCoordinates";

const GeoGloWSChart = () => {
  const [plotData, setPlotData] = useState(null);
  const mapCoordinates = useMapCoordinates();
  const latlng = mapCoordinates?.latlng;

  useEffect(() => {
    const handleGeoGloWSUpdate = async () => {
      try {
        if (!latlng) return;
        const args = {
          latitude: latlng.latitude,
          longitude: latlng.longitude,
        };
        const response = await fetch(
          `/apps/tethysdash/data?source=geo_glo_ws&args=${encodeURIComponent(JSON.stringify(args))}`
        );
        const result = await response.json();
        console.log(result.data);

        if (result.success) {
          setPlotData(result.data);
        } else {
          console.error("Error in response:", result);
        }
      } catch (err) {
        console.error("Error updating GeoGloWS data:", err);
      }
    };

    handleGeoGloWSUpdate();
  }, [latlng]);

  return (
    <Plot
      data={plotData.data}
      layout={plotData.layout}
      config={{ displayModeBar: true }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default GeoGloWSChart;
