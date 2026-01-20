import { useAnimation } from "components/contexts/AnimationContext";
import { useEffect, useState } from "react";

const useAnimateHook = () => {
  const [center, setCenter] = useState(null);
  const [zoom, setZoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { selectedRegion } = useAnimation();

  console.log("selectedRegion", selectedRegion);

  useEffect(() => {
    if (!selectedRegion?.region_name || !selectedRegion?.storage_type) return;

    const fetchCoordinates = async () => {
      let attempts = 0;
      let success = false;

      while (!success && attempts < 3) {
        try {
          attempts++;
          setLoading(true);
          setError(null);

          console.log(`Fetching region coords (try ${attempts})`);

          const response = await fetch(
            `http://ggst-api.geoglows.org/api/region_coordinates?region_name=${selectedRegion.region_name}&storage_type=${selectedRegion.storage_type}`
          );

          if (!response.ok) throw new Error("Bad Gateway");

          const data = await response.json();

          if (data?.status && data?.viewConfig) {
            setCenter(data.viewConfig.center);
            setZoom(data.viewConfig.zoom);
            success = true;
            console.log("Coordinates received:", data.viewConfig.center);
          }
        } catch (err) {
          console.warn("Failed attempt:", err.message);
          if (attempts === 3) setError("Failed after retries");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCoordinates();
  }, [selectedRegion]);

  return { center, zoom, loading, error };
};

export default useAnimateHook;
