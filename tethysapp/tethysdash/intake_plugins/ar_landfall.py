import intake
from .constants import (
    ARLandfallBaseUrl,
    ARLandfallModelLocationOptions,
    ARLandfallModelTypeOptions,
    ARLandfallModelOptions,
)


class ARLandfall(intake.source.base.DataSource):
    name = "cw3e_ar_landfall"
    version = "0.0.1"
    container = "python"
    visualization_tags = [
        "cw3e",
        "ar",
        "landfall",
        "gfs",
        "gefs",
        "ecmwf",
        "wrf",
        "probability",
        "coastal",
    ]
    visualization_description = "Displays the likelihood and timing of AR conditions at each point on the map in a line. Conditions for multiple models, AR types, and locations can be chosen. More information about individual AR products can be found at https://cw3e.ucsd.edu/iwv-and-ivt-forecasts/"
    visualization_args = {
        "data_source": ARLandfallModelOptions,
        "model_type": ARLandfallModelTypeOptions,
        "model_location": ARLandfallModelLocationOptions,
    }
    visualization_group = "CW3E"
    visualization_label = "AR Landfall Tool"
    visualization_type = "image"

    def __init__(self, data_source, model_type, model_location, metadata=None):
        # store important kwargs
        self.data_source = data_source
        self.model_type = model_type
        self.model_location = model_location
        super(ARLandfall, self).__init__(metadata=metadata)

    def read(self):
        """Return a version of the xarray with all the data in memory"""

        model_sources = {
            "GFS Ensemble": ARLandfallBaseUrl
            + "gefs/v12/LFT/US-west/GEFS_LandfallTool",
            "GEFS": ARLandfallBaseUrl + "gefs/v12/LFT/US-west/GEFS_LandfallTool",
            "U.S. National Model (GEFS)": ARLandfallBaseUrl
            + "gefs/v12/LFT/US-west/GEFS_LandfallTool",
            "ECMWF EPS": ARLandfallBaseUrl
            + "ECMWF/ensemble/LandfallTool/US-west/ECMWF_LandfallTool",
            "European Model (ECMWF)": ARLandfallBaseUrl
            + "ECMWF/ensemble/LandfallTool/US-west/ECMWF_LandfallTool",
            "ECMWF": ARLandfallBaseUrl
            + "ECMWF/ensemble/LandfallTool/US-west/ECMWF_LandfallTool",
            "ECMWF minus GFS": ARLandfallBaseUrl
            + "ECMWF/ensemble/LandfallTool/US-west/ECMWF-GEFS_LandfallTool",
            "West-WRF Ensemble": ARLandfallBaseUrl
            + "wwrf/images/ensemble/LFT/US-west/W-WRF_LandfallTool",
        }

        model_types = {
            "Control IVT magnitude": "_control",
            "Ensemble mean magnitude": "_ensemble_mean",
            "Probability of IVT >150 kg/m/s": "_150",
            "Probability of IVT >250 kg/m/s": "_250",
            "Probability of IVT >500 kg/m/s": "_500",
            "Probability of IVT >750 kg/m/s": "_750",
            "IVT >150 kg/m/s with Vectors": "_Vectors_150",
            "IVT >250 kg/m/s with Vectors": "_Vectors_250",
            "IVT >500 kg/m/s with Vectors": "_Vectors_500",
            "IVT >750 kg/m/s with Vectors": "_Vectors_750",
        }

        model_location = {
            "Coastal": "_coast",
            "Foothills": "_foothills",
            "Inland": "_inland",
            "Interior West": "_intwest",
        }

        return (
            model_sources[self.data_source]
            + model_types[self.model_type]
            + model_location[self.model_location]
            + "_current.png"
        )