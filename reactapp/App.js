import ErrorBoundary from "components/error/ErrorBoundary";
import Layout from "components/layout/Layout";
import Loader from "components/loader/AppLoader";
import AppTour from "components/appTour/AppTour";
import { ModalPriorityProvider } from "components/contexts/ModalPriorityContext";
import MapCoordinatesProvider from "components/contexts/MapCoordinates";

import "App.scss";

function App() {
  return (
    <>
      <ErrorBoundary>
        <ModalPriorityProvider>
          <MapCoordinatesProvider>
            <Loader>
              <AppTour />
              <Layout />
            </Loader>
          </MapCoordinatesProvider>
        </ModalPriorityProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;
