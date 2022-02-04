from base64 import encode
import os
import json
import numpy as np

DATASETS_PATH = './static/datasets'

class datasets():
    @staticmethod
    def getDemo(req, res):
        """ get demo datasets model """
        # get request data
        data = req.get_json()

        # get data
        demo_train_path = os.path.join(DATASETS_PATH, 'demo/train')
        datas = []
        for filename in os.listdir(demo_train_path):
            data = None
            filePath = os.path.join(demo_train_path, filename)
            with open(filePath, 'r', encoding='utf-8') as fr:
                data = json.load(fr)
            data['filename'] = filename
            datas.append(data)

        # make response
        res.message = 'Get demo datasets successfully.'
        res.data    = datas
        return res