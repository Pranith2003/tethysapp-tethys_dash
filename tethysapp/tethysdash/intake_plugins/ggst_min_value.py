import intake
import requests
from intake.source import base


class FetchMinValueDataSource(base.DataSource):
    name = 'fetch_min_value'
    version = '0.0.1'
    container = 'python'

    visualization_label = 'Min'
    visualization_type = 'variable_input' 
    visualization_group = 'Custom Intake Plugins'

    visualization_args = {
        'region_name': {
            'type': 'string',
            'description': 'Name of the region'
        },
        'storage_type': {
            'type': 'string',
            'description': 'Name of the storage type'
        },
    }

    def __init__(self, region_name=None, storage_type=None, metadata=None, **kwargs):
        super().__init__(metadata=metadata)
        self.region_name = region_name
        self.storage_type = storage_type

    def read(self):
        """
        Returns a dict with a 'text' key for the JS 'number' viz
        """

        # When the region_name is missing, return an object with a text key
        if not self.region_name:
            return {"text": None}

        base_url = "http://ggst-api.geoglows.org"
        url = f"{base_url}/api/fetchRange/{self.region_name}"

        if self.storage_type:
            url = f"{url}/{self.storage_type}"

        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return {"text": None}

        min_value = response.json().get("min")
        return {
            "variable_name": "Min",
            "initial_value": min_value,
            "variable_options_source": "number"
        }
