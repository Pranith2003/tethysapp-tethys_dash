import intake
import requests


class GGSTMinValueDataSource(intake.source.base.DataSource):
    """
    Intake datasource to fetch MIN value from GGST backend
    """

    name = "ggst_min_value"
    version = "0.0.1"
    container = "python"
    partition_access = False

    # ---- Optional metadata for TethysDash UI ----
    visualization_label = "GGST Min Value"
    visualization_type = "variable_input"
    visualization_group = "GGST"
    visualization_args = {
        "region": {"type": "string", "description": "Region name"},
        "storage_type": {"type": "string", "description": "Storage type (optional)"}
    }
    visualization_tags = ["min", "range", "ggst"]
    visualization_description = "Fetch minimum range value from GGST API"

    def __init__(
        self,
        metadata=None,
        region=None,
        storage_type=None,
    ):
        super().__init__(metadata=metadata)
        self.region = (region or "GRC_grace")
        self.storage_type = storage_type
        self._data = None

    # -------------------------------
    # Intake required methods
    # -------------------------------
    def _get_schema(self):
        return intake.source.base.Schema(
            datashape=None,
            dtype=float,
            shape=(),
            npartitions=1,
            extra_metadata={},
        )

    def read(self):
        """Return min value (scalar)"""
        if self._data is None:
            self._load_data()
        min =  self._data

        return {
            "variable_name": "Minimum",
            "initial_value": min,
            "variable_options_source": min,
        }

    # -------------------------------
    # Internal logic
    # -------------------------------
    def _load_data(self):
        print(
            f"Fetching MIN value for region: {self.region}, "
            f"storage_type: {self.storage_type}"
        )

        base_url = f"http://ggst-api.geoglows.org/api/fetchRange/{self.region}"

        if self.storage_type:
            url = f"{base_url}/{self.storage_type}"
        else:
            url = base_url

        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            raise Exception(
                f"Failed to fetch min value: {response.status_code}"
            )

        data = response.json()

        if "min" not in data:
            raise ValueError("API response missing 'min' key")

        self._data = data["min"]