import { useContext, useState } from "react";
import { MapAnimationsContext } from "./Contexts";

export const AnimationProvider = ({ children }) => {
  const [selectedRegion, setSelectedRegion] = useState({
    region_name: null,
    storage_type: "grace",
  });

  return (
    <MapAnimationsContext.Provider
      value={{ selectedRegion, setSelectedRegion }}
    >
      {children}
    </MapAnimationsContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(MapAnimationsContext);
  if (!context) return null;
  return context;
};
