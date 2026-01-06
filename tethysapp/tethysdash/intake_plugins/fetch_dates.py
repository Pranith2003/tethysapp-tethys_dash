import intake
import requests
from intake.source import base

class FetchDatesDataSource(base.DataSource):
    name = 'fetch_dates'
    version = '0.0.1'
    container = 'python'
    visualization_label = 'Select Date'
    visualization_type = 'variable_input'
    visualization_group = 'Custom Intake Plugins'

    # Inputs expected from other plugins / dashboard state
    visualization_args = {
        'region_name': {
            'type': 'string', 'description': 'Name of the region'
        },
        'storage_type': {
            'type': 'string', 'description': 'Name of the storage type'
        },
    }

    def __init__(self, region_name=None, storage_type=None, metadata=None, **kwargs):
        super().__init__(metadata=metadata)
        self.region_name = region_name
        self.storage_type = storage_type

    def read(self):
        if not self.region_name or not self.storage_type:
            return {
                "variable_name": "Date",
                "initial_value": None,
                "variable_options_source": []
            }

        base_url = "http://ggst-api.geoglows.org"
        url = f"{base_url}/api/fetchDates/{self.region_name}/{self.storage_type}"

        response = requests.get(url)
        if response.status_code != 200:
            dates = []
        else:
            dates = response.json().get("dates", [])

        return {
            "variable_name": "Date",
            "initial_value": dates[0] if dates else None,
            "variable_options_source": dates
        }


# intake.register_driver(FetchDatesDataSource.name, FetchDatesDataSource)