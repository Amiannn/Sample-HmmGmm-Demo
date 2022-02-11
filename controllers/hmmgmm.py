import os
import json
import numpy as np

from app import app

from lib.Sample_HMM_GMM.hmm.hmm   import HMM
from sklearn.mixture import GaussianMixture

DATASETS_PATH = './static/datasets'

class hmmgmm():
    hmm = HMM(states_length=5, mixtures=2)
    hmm.load('./lib/Sample_HMM_GMM/outputs/hmm_0')

    @staticmethod
    def get(req, res):
        """ get hidden markov model """
        # get request data
        data = req.get_json()

        # get hmm
        initials    = np.exp(hmmgmm.hmm.states.initials_log).tolist()
        transitions = hmmgmm.hmm.states.transition_matrix.tolist()
        emissions   = [
            {
                'means'     : gmm.means_.tolist(),
                'weights'    : gmm.weights_.tolist(),
                'covariances': gmm.covariances_.tolist()
            } for gmm in hmmgmm.hmm.states.emissions
        ]

        # make response
        res.message = 'Get hidden markov model successfully.'
        res.data    = {
            'initials'   : initials,
            'transitions': transitions,
            'emissions'  : emissions
        }
        return res

    @staticmethod
    def generate(req, res):
        """ hidden markov model generator"""
        # get request data
        data = req.get_json()

        # generator
        seq_datas = hmmgmm.hmm.generate(1000)
        datas     = []

        for seq_data in seq_datas:
            seq, value = seq_data
            datas.append([int(seq), value[0][0]])

        # make response
        res.message = 'Get hidden markov model successfully.'
        res.data    = {
            'sequences': datas
        }
        return res

    @staticmethod
    def update(req, res):
        """ update hidden markov model """
        # get request data
        data = req.get_json()
        
        # get data
        initials    = np.exp(hmmgmm.hmm.states.initials_log).tolist()
        transitions = data['transitions']
        emissions   = data['emissions']

        # reset transitions
        hmmgmm.hmm.states.reset_transition(np.array(transitions))

        # reset emissions
        new_emissions = []
        for s in range(hmmgmm.hmm.states.length):
            means   = np.array(emissions[s]['means'])
            covars  = np.array(emissions[s]['covariances'])
            weights = np.array(emissions[s]['weights'])
            
            loaded_gmm = GaussianMixture(n_components = len(means), covariance_type='full')
            loaded_gmm.precisions_cholesky_ = np.linalg.cholesky(np.linalg.inv(covars))
            loaded_gmm.means_       = means
            loaded_gmm.covariances_ = covars
            loaded_gmm.weights_     = weights
            new_emissions.append(loaded_gmm)
        hmmgmm.hmm.states.reset_emissions(new_emissions)

        # make response
        res.message = 'Update hidden markov model successfully.'
        return res

    @staticmethod
    def trainDemo(req, res):
        """ train hidden markov model """
        # get request data
        data = req.get_json()

        filename = data['filename']
        demoTrainPath = os.path.join(DATASETS_PATH, 'demo/train/' + filename)

        demoDataset = None
        with open(demoTrainPath, 'r', encoding='utf-8') as fr:
            demoDataset = json.load(fr)

        train_data = np.array(demoDataset['data']).reshape(-1, 1)
        
        # create model instance
        # hmm = HMM(states_length=5, mixtures=2)
        hmm = hmmgmm.hmm
        
        _, history = hmm.train(observations=[train_data], epoch=10)

        # make response
        res.message = 'Train Demo hidden markov model successfully.'
        res.data    = {
            'history': history
        }
        return res

