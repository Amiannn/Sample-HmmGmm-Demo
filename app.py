from flask import Flask
from flask import request
from flask import jsonify

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# # add config
# from cfg import config

# # server
# app.config['SERVER_NAME'] = config.SERVER_NAME

# add router
from router import *