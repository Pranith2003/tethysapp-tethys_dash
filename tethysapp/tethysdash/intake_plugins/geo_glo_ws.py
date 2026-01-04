import intake
import requests
import plotly.graph_objects as go

class GeoGloWSDataSource(intake.source.base.DataSource):
    name = 'geo_glo_ws'
    version = '0.0.1'
    container = 'python'
    partition_access = True

    visualization_label = 'GeoGloWS Storage Chart'
    visualization_type = 'ploty'
    visualization_group = 'GeoGloWS'
    visualization_args = {
        'lat': {'type': 'float', 'description': 'Latitude'},
        'lon': {'type': 'float', 'description': 'Longitude'}
    }
    visualization_tags = ['chart', 'plot', 'line', 'geoglows']
    visualization_description = 'Display storage values from GeoGloWS API'

    def __init__(self, metadata=None, latitude=None, longitude=None, region=None, storage_type=None):
        super().__init__(metadata=metadata)
        self.region = region or 'katherine_nt'
        self.storage_type = storage_type or 'grace'
        self.latitude = float(latitude) if latitude is not None else -14.2
        self.longitude = float(longitude) if longitude is not None else 132.2
        self._data = None

    def update_coordinates(self, latitude, longitude):
        """Update the coordinates and reset the data"""
        self.latitude = latitude
        self.longitude = longitude
        self._data = None  # Force data refresh on next read
        return self.read()  # Return new data immediately

    def _get_schema(self):
        return intake.source.base.Schema(
            datashape=None,
            dtype=None,
            shape=None,
            npartitions=1,
            extra_metadata={},
        )

    def _get_partition(self, _):
        if self._data is None:
            self._load_data()
        return self._data

    def read(self):
        """Read the data and return formatted for plotting"""
        if self.latitude is None or self.longitude is None:
            raise ValueError("Latitude and longitude must be provided")
        print(f"Reading data for lat: {self.latitude}, lon: {self.longitude}, storage type: {self.storage_type}")
        if self._data is None:
            self._load_data()
        
        return {
            "data": [{
                "x": self._data['timestamp'],
                "y": self._data['value'],
                "type": "scatter",
                "mode": "lines",
                "name": f"{self.storage_type.upper()} Values"
            }],
            "layout": {
                "title": f"{self.storage_type.upper()} Values for lat: {self.latitude:.4f}, lon: {self.longitude:.4f}",
                "xaxis": {"title": "Timestamp", "type": "date"},
                "yaxis": {"title": f"{self.storage_type.upper()} Value"}
            }
        }

    def _load_data(self):
        if self.latitude is None or self.longitude is None:
            raise ValueError("Latitude and longitude must be provided")
            
        print(f"Fetching data for lat: {self.latitude}, lon: {self.longitude}, storage type: {self.storage_type}")
        url = (
            f'http://ggst-api.geoglows.org/api/getPointValues/'
            f'?latitude={self.latitude}&longitude={self.longitude}&storage_type={self.storage_type}'
        )
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            timestamps = [item[0] for item in data['values']]
            values = [item[1] for item in data['values']]
            self._data = {
                'timestamp': timestamps,
                'value': values
            }
        else:
            raise Exception(f"Failed to fetch data: {response.status_code}")

# Register with Intake
# intake.register_driver(GeoGloWSDataSource.name, GeoGloWSDataSource)

