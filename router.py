from app import app

from controllers.hmmgmm   import hmmgmm
from controllers.datasets import datasets

from utils import router

# ============================================================================
# "                         FRONTEND HTML PAGE                               "
# ============================================================================

# Web page
router.render_page(url='/',        template='index.html')
router.render_page(url='/hmm',     template='hmm.html')
router.render_page(url='/viterbi', template='viterbi.html')

# ============================================================================
# "                             BACKEND API                                  "
# ============================================================================

# HmmGmm api
router.get (url='/api/hmmgmm/get',       controller=hmmgmm.get)
router.get (url='/api/hmmgmm/generate',  controller=hmmgmm.generate)
router.post(url='/api/hmmgmm/update',    controller=hmmgmm.update)
router.post(url='/api/hmmgmm/trainDemo', controller=hmmgmm.trainDemo)

# Dataset api
router.get (url='/api/datasets/demo/get', controller=datasets.getDemo)
