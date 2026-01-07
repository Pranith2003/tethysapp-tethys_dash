import intake
import requests
from intake.source import base


class FetchMaxValueDataSource(base.DataSource):
    name = 'fetch_max_value'
    version = '0.0.1'
    container = 'python'

    visualization_label = 'Max Value'
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
        Returns configuration for a UI variable input
        """
        if not self.region_name:
            return {
                "variable_name": "Max",
                "initial_value": None,
                "variable_options_source": []
            }

        base_url = "http://ggst-api.geoglows.org"
        url = f"{base_url}/api/fetchRange/{self.region_name}"

        if self.storage_type:
            url = f"{url}/{self.storage_type}"

        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            max_value = None
        else:
            max_value = response.json().get("max")

        return {
            "variable_name": "Max",
            "initial_value": max_value,
            "variable_options_source": "number"
        }

