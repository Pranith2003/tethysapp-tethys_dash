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
    const fetchCoordinates = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("loading");
        const response = await fetch(
          `http://ggst-api.geoglows.org/api/region_coordinates?region_name=${selectedRegion.region_name}&storage_type=${selectedRegion.storage_type}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch region coordinates");
        }

        const data = await response.json();

        if (data?.status && data?.viewConfig) {
          setCenter(data.viewConfig.center); // [lat, lon]
          setZoom(data.viewConfig.zoom);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinates();
  }, [selectedRegion]);

  return { center, zoom, loading, error };
};

export default useAnimateHook;
