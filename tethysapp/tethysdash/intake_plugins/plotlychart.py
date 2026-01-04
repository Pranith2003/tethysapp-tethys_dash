from intake.source import base
import intake
class PlotlyExample(base.DataSource):
    container = "python"
    version = "0.0.1"
    name = "plotly_example"
    visualization_args = {}
    visualization_group = "GeoGloWS"
    visualization_label = "Plotly Example"
    visualization_type = "plotly"
    visualization_tags = [
        "example",
        "plotly",
    ]
    visualization_description = "An example plugin for the plotly visualization"

    def __init__(self, metadata=None):
        super(PlotlyExample, self).__init__(metadata=metadata)

    def read(self):
        """
        Return plotly information
        """
        data = [
            {
                "type": "scatter",  # all "scatter" attributes: https://plotly.com/javascript/reference/#scatter
                "x": [1, 2, 3],  # more about "x": #scatter-x
                "y": [3, 1, 6],  # #scatter-y
                "marker": {  # marker is an object, valid marker keys: #scatter-marker
                    "color": "rgb(16, 32, 77)"  # more about "marker.color": #scatter-marker-color
                },
            },
            {
                "type": "bar",  # all "bar" chart attributes: #bar
                "x": [1, 2, 3],  # more about "x": #bar-x
                "y": [3, 1, 6],  # #bar-y
                "name": "bar chart example",  # bar-name
            },
        ]

        layout = {  # all "layout" attributes: #layout
            "title": "simple example",  # more about "layout.title": #layout-title
            "xaxis": {  # all "layout.xaxis" attributes: #layout-xaxis
                "title": "time"  # more about "layout.xaxis.title": #layout-xaxis-title
            },
            "annotations": [  # all "annotation" attributes: #layout-annotations
                {
                    "text": "simple annotation",  # #layout-annotations-text
                    "x": 0,  # #layout-annotations-x
                    "xref": "paper",  # #layout-annotations-xref
                    "y": 0,  # #layout-annotations-y
                    "yref": "paper",  # #layout-annotations-yref
                }
            ],
        }

        config = {"displayModeBar": True}

        return {"data": data, "layout": layout, "config": config}

# intake.register_driver(PlotlyExample.name, PlotlyExample)