import ErrorBoundary from "components/error/ErrorBoundary";
import Layout from "components/layout/Layout";
import Loader from "components/loader/AppLoader";
import AppTour from "components/appTour/AppTour";
import { ModalPriorityProvider } from "components/contexts/ModalPriorityContext";
import MapCoordinatesProvider from "components/contexts/MapCoordinates";
import { AnimationProvider } from "components/contexts/AnimationContext";

import "App.scss";

function App() {
  return (
    <>
      <ErrorBoundary>
        <ModalPriorityProvider>
          <MapCoordinatesProvider>
            <Loader>
              <AppTour />
              <AnimationProvider>
                <Layout />
              </AnimationProvider>
            </Loader>
          </MapCoordinatesProvider>
        </ModalPriorityProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;
