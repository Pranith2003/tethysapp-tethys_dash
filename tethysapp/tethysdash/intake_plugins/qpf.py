from intake.source import base
from .constants import CW3EHUC8s, QPF_visualizations


class QPF(base.DataSource):
    container = "python"
    version = "0.0.1"
    name = "cw3e_qpf"
    visualization_tags = ["cw3e", "qpf", "precipitation", "huc8"]
    visualization_description = "Depicts the mean areal precipiation (MAP) at different lead times from several numerical weather prediction models and NOAA/NWS forecasts. More information can be found at https://cw3e.ucsd.edu/Projects/QPF/QPF-HUC8.html"
    visualization_args = {
        "HUC8": CW3EHUC8s,
        "QPF_visualization": QPF_visualizations,
    }
    visualization_group = "CW3E"
    visualization_label = "10-day Model Precipitation Forecasts"
    visualization_type = "image"
    visualization_attribution = "CW3E"

    def __init__(self, HUC8, QPF_visualization, metadata=None):
        # store important kwargs
        self.HUC8 = HUC8
        self.QPF_visualization = QPF_visualization
        super(QPF, self).__init__(metadata=metadata)

    def read(self):
        """Return a version of the xarray with all the data in memory"""

        QPF_base_url = "https://cw3e.ucsd.edu/Projects/QPF/images/HUC8/"

        plot_type = {
            "10-Day Mean QPF Table": "table_",
            "10-Day Accumulated Ensemble QPF": "combo_",
            "10-Day 6-Hour Ensemble QPF": "grid_",
        }

        return QPF_base_url + plot_type[self.QPF_visualization] + self.HUC8 + ".png"