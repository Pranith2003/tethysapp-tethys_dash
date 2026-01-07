import requests

_RANGE_CACHE = {}


def fetch_range(region_name, storage_type=None):
    key = (region_name, storage_type)

    if key in _RANGE_CACHE:
        return _RANGE_CACHE[key]

    base_url = "http://ggst-api.geoglows.org"
    url = f"{base_url}/api/fetchRange/{region_name}"

    if storage_type:
        url = f"{url}/{storage_type}"

    r = requests.get(url)
    r.raise_for_status()
    data = r.json()

    result = {
        "min": float(data.get("min")),
        "max": float(data.get("max")),
    }

    _RANGE_CACHE[key] = result
    return result
