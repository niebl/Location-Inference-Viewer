#!/usr/bin/python3

from flask import Flask, request, send_from_directory
import re

#imports related to the inference engine
from sklearn.cluster import DBSCAN 
import inferenceEngine
import csvToGeoJSON
from models import *
from scoringTypes import *

ALLOWED_EXTENSIONS = {'csv', 'json'}
app = Flask(__name__)


@app.route("/src/<path:path>")
def get_static(path):
    print(path)
    return send_from_directory('public', path)

@app.route("/inferenceViewer")
def get_site():
    return send_from_directory('public', "index.html")


@app.route("/infer", methods=["GET","POST"])
def infer():
    '''
        URL params: min_samples, eps
        BODY params: trajectory, (session-ID)
    '''
    # store the trajectory, and run the inference
    if request.method == 'POST':
        min_samples = int(request.args.get("min_samples", default="7"))
        eps = float(request.args.get("eps", default="7")) / 6471

        trajectory = getBodyParam(request, "trajectory")
        filetype = getBodyParam(request, "filetype")

        trajectoryJSON = None 
        #check if csv
        if filetype == "text/csv":
            trajectory = "\n".join(trajectory)
            trajectoryJSON = csvToGeoJSON.Converter.convert(trajectory)

        if filetype == "text/json":
            trajectoryJSON = trajectory

        userData.setTrajectory(trajectoryJSON)

        #TODO: so far this only works for csv
        inference = userData.inferenceEngine.makeInference(
            trajectoryJSON, 
            userData.inferenceDefinitions, 
            eps, 
            min_samples
        )
        userData.setInference(inference)
        return inference

    # run the inference on the stored trajectory
    elif request.method == 'GET':
        min_samples = int(request.args.get("min_samples", default="7"))
        eps = float(request.args.get("eps", default="7")) / 6471

        print(min_samples)
        print(eps)

        inference = userData.inferenceEngine.makeInference(
            userData.getTrajectory(), 
            userData.inferenceDefinitions, 
            eps, 
            min_samples
        )
        userData.setInference(inference)
        output = userData.getInference()
        return f"{output}"



def getBodyParam(request, param):
    result = None
    #request body params
    result = request.form.get(param, default=result)
    if request.is_json:
        json = request.get_json()
        result = json.get(param)
    return result
        
#facade that could later implement a database
class UserStorage:
    def __init__(self):
        self.trajectory = None
        self.inference = None
        self.inferenceDefinitions = [ #inferenceDefinition. the parameters for the inference
            InferenceDefinition("nightness", 1, 0.3),
            InferenceDefinition("workHours9to5", 1, 0.3),
            InferenceDefinition("pointCount", 1, 0.3)
        ]
        self.inferenceEngine = inferenceEngine.InferenceEngine()
        return

    def setTrajectory(self, trajectory, user=None):
        self.trajectory = trajectory
    
    def getTrajectory(self, user=None):
        return self.trajectory

    def setInference(self, inference, user=None):
        self.inference = inference

    def getInference(self, user=None):
        return self.inference

userData = UserStorage()