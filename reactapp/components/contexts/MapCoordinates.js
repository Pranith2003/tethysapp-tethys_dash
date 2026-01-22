import { useContext, useState } from "react";
import { MapCoordinatesContext } from "components/contexts/Contexts";

const MapCoordinatesProvider = ({ children }) => {
  const [latlng, setlatlng] = useState({
    latitude: 40.85,
    longitude: 70.38,
  });
  return (
    <MapCoordinatesContext.Provider
      value={{
        latlng,
        setlatlng,
      }}
    >
      {children}
    </MapCoordinatesContext.Provider>
  );
};

export default MapCoordinatesProvider;

export const useMapCoordinates = () => {
  const context = useContext(MapCoordinatesContext);
  if (!context) return null;
  return context;
};
