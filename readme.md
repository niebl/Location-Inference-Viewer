# Inference Viewer

Web app that uses a python implementation of the inference engine implemented in the [SIMPORT learning app](https://github.com/sitcomlab/simport-learning-app).

This web-app allows the user to visualize, what kind of information about them can be inferred by analyzing their daily trajectory.

takes trajectory-data in csv-format. The following columns are to be included: `lat, lon, timestamp/timestamp_ms`.

development of this app took a (minor) part in my bachelors thesis.

## Installation
1. install requirements.txt `pip install -r requirements.txt`
2. run server `flask --app inferenceViewer.py run`
3. view app on `localhost:5000/inferenceViewer`

## disclaimer
This app is not yet suitable for production
