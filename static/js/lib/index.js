import { hmmApi }     from './api/hmm.js';
import { datasetApi } from './api/datasets.js';

import { hmm_graphic_init, getGraphic, getViterbiGraphic, drawViterbi } from './hmm_graphic.js';
import { gmm_graphic_init, plotCircle, plotGenerate, plotTrainHist, drawGMMs } from './gmm_graphic.js';
import { plotDemoTrain } from './dataset_graphic.js';

const mean_scale  = 100;
const covar_scale = 10000;
const mean_delta  = 0.5   * mean_scale;
const covar_delta = 0.005 * covar_scale;

function transition_table(data){
    var transitions = data.data.transitions;
    var gmms = data.data.emissions;

    var sub_template_1 = '';
    var sub_template_2 = '';

    for(let i = 0; i < transitions.length; i++){
        sub_template_1 += `<th scope="col">S${ i }</th>
        `;
        var sub_template = '';
        for(let j = 0; j < transitions[i].length; j++){
            var value = Math.round(transitions[i][j] * 100) / 100;
            sub_template += `<td><input type="text" id="input_S_${ i }_${ j }" value=${ value } style="border:none;width: 60px;height: 60px;text-align:center;"></td>
            `;
        }
        sub_template = `
            <tr>
                <th scope="row">S${ i }</th>
                ${ sub_template }
            </tr>
        `;
        sub_template_2 += sub_template;
    }

    var trans_template = `
        <table class="table table-bordered table-hover align-middle border border-1">
            <thead>
                <tr>
                    <th scope="col">Transition</th>
                    ${ sub_template_1 }
                </tr>
            </thead>
            <tbody>
                ${ sub_template_2 }
            </tbody>
        </table>
    `;
    $('#trans_table').html(trans_template);
    add_transition_event(transitions.length, gmms[0].means.length);
}

function emission_table(data){
    var gmms = data.data.emissions;
    var sub_template = '';

    for(let i = 0; i < gmms.length; i++){
        var sub_template_means   = '';
        var sub_template_covars  = '';
        var sub_template_weights = '';

        var mean_avg  = 0.0;
        var covar_avg = 0.0;

        for(let j = 0;j < gmms[i].means.length; j++){
            mean_avg  += gmms[i].means[j][0] * mean_scale;
            covar_avg += gmms[i].covariances[j][0][0] * covar_scale;
        }

        mean_avg  /= gmms[i].means.length;
        covar_avg /= gmms[i].means.length;

        for(let j = 0;j < gmms[i].means.length; j++){
        
            var mean = gmms[i].means[j][0] * mean_scale;
            var mean_min = mean_avg - mean_delta;
            var mean_max = mean_avg + mean_delta;
            
            var covar = gmms[i].covariances[j][0][0] * covar_scale;
            var covar_min = covar_avg - covar_delta;
            var covar_max = covar_avg + covar_delta;
            if(covar_min < 0) covar_min = 0.0;

            sub_template_means += `
                <input type="range" class="form-range" id="range_S_${ i }_means_${ j }" min=${ mean_min } max=${ mean_max } value=${ mean }>
            `;

            sub_template_covars += `
                <input type="range" class="form-range" id="range_S_${ i }_covars_${ j }" min=${ covar_min } max=${ covar_max } value=${ covar }>
            `;
        }
        var weights = gmms[i].weights[0] * mean_scale;
        sub_template_weights = `
            <input type="range" class="form-range" id="range_S_${ i }_weights" min=0 max=${ mean_scale } value=${ weights }>
        `;
        sub_template += `
            <tr>
                <th scope="row">S${ i }</th>
                <td>
                    ${sub_template_means}
                </td>
                <td>
                    ${sub_template_covars}
                </td>
                <td>
                    ${sub_template_weights}
                </td>
            </tr>
        `;
    }

    var emission_template = `
        <table class="table table-bordered table-hover align-middle">
            <thead>
                <tr>
                    <th scope="col">Emission(GMM)</th>
                    <th scope="col">means</th>
                    <th scope="col">variances</th>
                    <th scope="col">weights</th>
                </tr>
            </thead>
            <tbody>
                ${ sub_template }
            </tbody>
        </table>
    `;
    $('#emiss_table').html(emission_template);
    add_emission_event(gmms.length, gmms[0].means.length);
}

function trans_handler(e, states_length, mixtrue_length, id) {
    var datas = get_transition_data(states_length);
    
    for(let i = 0;i < states_length; i++){
        var row_sum = 0.0;
        for(let j = 0;j < states_length; j++){
            row_sum += datas[i][j];
        }
        if(row_sum == 0 || isNaN(row_sum)) {
            for(let j = 0;j < states_length; j++) datas[i][j] = 0;
            datas[i][states_length - 1] = 1;
        } else {
            for(let j = 0;j < states_length; j++){
                datas[i][j] /= row_sum;
                datas[i][j] =  Math.round(datas[i][j] * 100) / 100;
            }
        }
    }
    reset_transition_data(states_length, datas);

    var req_datas = {
        'transitions': datas,
        'emissions'  : get_emission_data(states_length, mixtrue_length),
    }
    // console.log(req_datas);
    hmmApi.update(req_datas, reload_graphic, console.log);
}

function emiss_handler(e, states_length, mixtrue_length, id) {
    var datas = get_emission_data(states_length, mixtrue_length);
    
    var req_datas = {
        'transitions': get_transition_data(states_length),
        'emissions'  : datas,
    }
    // console.log(req_datas);s
    hmmApi.update(req_datas, reload_graphic, console.log);
}

function add_transition_event(states_length, mixtrue_length){
    for(let i = 0;i < states_length; i++){
        for(let j = 0; j < states_length; j++){
            var input = document.getElementById(`input_S_${ i }_${ j }`);
            input.addEventListener('focusout', (e)=>trans_handler(e, states_length, mixtrue_length, {i, j}));
        }
    }
}

function add_emission_event(states_length, mixtrue_length){
    for(let i = 0;i < states_length; i++){
        for(let j = 0;j < mixtrue_length; j++){
            var mean  = document.getElementById(`range_S_${ i }_means_${ j }`);
            var covar = document.getElementById(`range_S_${ i }_covars_${ j }`);
            mean.addEventListener('input', (e)=>emiss_handler(e, states_length, mixtrue_length, {i, j}));
            covar.addEventListener('input', (e)=>emiss_handler(e, states_length, mixtrue_length, {i, j}));
        }
        var weight = document.getElementById(`range_S_${ i }_weights`);
        weight.addEventListener('input', (e)=>emiss_handler(e, states_length, mixtrue_length, {i}));
    }
}

function reset_transition_data(states_length, datas){
    for(let i = 0;i < states_length; i++){
        for(let j = 0; j < states_length; j++){
            document.getElementById(`input_S_${ i }_${ j }`).value = datas[i][j];
        }
    }
}

function get_transition_data(states_length){
    var trans_datas = [];
    for(let i = 0;i < states_length; i++){
        var trans_data = [];
        for(let j = 0; j < states_length; j++){
            var input = document.getElementById(`input_S_${ i }_${ j }`).value;
            trans_data.push(parseFloat(input));
        }
        trans_datas.push(trans_data);
    }
    return trans_datas;
}

function get_emission_data(states_length, mixtrue_length){
    var emiss_datas = [];
    for(let i = 0;i < states_length; i++){
        var emiss_data = {means:[], covariances:[], weights:[]};
        for(let j = 0;j < mixtrue_length; j++){
            var mean  = document.getElementById(`range_S_${ i }_means_${ j }`).value;
            var covar = document.getElementById(`range_S_${ i }_covars_${ j }`).value;
            emiss_data.means.push([parseFloat(mean) / mean_scale]);
            emiss_data.covariances.push([[parseFloat(covar) / covar_scale]]);
        }
        var weight = document.getElementById(`range_S_${ i }_weights`).value;
        emiss_data.weights.push(parseFloat(weight) / mean_scale);
        emiss_data.weights.push(1 - parseFloat(weight) / mean_scale);
        emiss_datas.push(emiss_data);
    }
    return emiss_datas;
}

function reload_graphic(){
    hmmApi.get((data)=> {
        gmm_graphic_init(data);
        hmm_graphic_init(data, cygraphic);
    }, console.log);
}

function generate_handler(){
    hmmApi.generate(display_sequence, console.log);
}

var display_timer = null;

function display_sequence(data){
    var sequence_datas = data.data.sequences;
    var index = 0;
    var clear_= 0;

    var display_sequence = [];
    for(let i = 0;i < sequence_datas.length - 1; i++){
        var node  = `#S${ sequence_datas[i][0] }`;
        var emiss = `#M${ sequence_datas[i][0] }`;
        var edge  = `#e${ sequence_datas[i][0] }_${ sequence_datas[i+1][0] }`
        display_sequence.push([node, sequence_datas[i][1], sequence_datas[i][0]]);
        display_sequence.push([emiss, sequence_datas[i][1], sequence_datas[i][0]]);
        display_sequence.push([edge, sequence_datas[i][1]]);
    }

    $("#generate_display_div").show();

    function display_hmm() {
        if(index == sequence_datas.length - 1) clearTimeout(display_timer);

        if(clear_ == 0) {
            var now  = display_sequence[index][0];
            cygraphic.$(now).addClass('highlighted');
            if(now[1] == "M"){
                // output value
                var value = Math.round(display_sequence[index][1] * 100) / 100;
                // $('#generate_p').html(
                //     $('#generate_p').html() +
                //     `<span class="badge rounded-pill bg-dark">${ 
                //         value
                //      }</span>　`
                // );
                // plot generate sequence
                plotGenerate('plot_generate', value, display_sequence[index][2]);

                // plot emission value
                plotCircle({x: display_sequence[index][1], y:0}, `plot_div_plot_${ display_sequence[index][2] }`)
            }
            index += 1;
        } else {
            var last = display_sequence[index - 1][0];
            cygraphic.$(last).removeClass('highlighted');
        }
        clear_ = (clear_ + 1) % 2;
    }
    clearTimeout(display_timer);
    display_timer = setInterval(display_hmm, 200);
}

function getDemoTrainOption() {
    datasetApi.getDemo(displayDemoTrain, console.log);
    
    function displayDemoTrain(data) {
        var template = ``;
        demoDatasets = data.data;

        for(let i = 0;i < demoDatasets.length; i++) {
            template += `
                <option value="${ i }">${ demoDatasets[i].name }</option>
            `;
        };
        $("#train_data_select").html(template);
        plotDemoTrain('plot_demo_train', [demoDatasets[0].data], [demoDatasets[0].name]);
        hmmApi.get((data)=> {
            drawGMMs('demo_plot_div', data);
            gmm_graphic_init(data);
            hmm_graphic_init(data, demoCygraphic);
        }, console.log);

        var demoTrainDataSelector = document.getElementById("train_data_select");
        demoTrainDataSelector.addEventListener('change', (e)=>demoTrainDataHandler(e, demoDatasets, parseInt(demoTrainDataSelector.value)))
    }
}

function demoTrainDataHandler(e, dataDatasets, index) {
    var dataset = dataDatasets[index];

    plotDemoTrain('plot_demo_train', [dataset.data], [dataset.name]);
}

function demoTrainingHandler(e) {
    var dataIndex = document.getElementById("train_data_select").value;
    var data = {
        'filename': demoDatasets[dataIndex].filename
    }
    // call api
    hmmApi.trainDemo(data, demoTraining, console.log);

    function demoTraining(data) {
        var history = data.data.history;

        // display init
        var init = history['init'];
        // plot splited sequence
        plotDemoTrain('plot_demo_train', init.sequences, []);
        // plot model
        drawGMMs('demo_plot_div', {data:init});
        hmm_graphic_init({data:init}, demoCygraphic);
        // plot sequence splited point
        for(let s = 0;s < init.sequences.length; s++) {
            var y = [];
            for(let i = 0; i < init.sequences[s].length; i++) y.push(0)
            
            plotTrainHist({x: init.sequences[s], y:y}, `demo_plot_div_plot_${ s }`, s)
        }
        // viterbi graphic init
        viterbiCygraphic = getViterbiGraphic('viterbi_hmm_iframe', 'cy');

        // set viterbi epoch selector
        // var epoch_template = ``;

        // for(let i = 0;history['epoch_' + i] != null; i++) {
        //     epoch_template += `
        //         <option value="epoch_${ i }">epoch ${ i }</option>
        //     `;
        // };
        // $("#viterbi_epoch_select").html(epoch_template);
        var viterbi_btn = document.getElementById('viterbi_epoch_btn');
        viterbi_btn.addEventListener('click', (e)=>display_viterbi_handler(e, history));
        $("#train_demo_btn").html(`
            <div class="spinner-border" role="status" style="width: 1rem; height: 1rem;">
                <span class="visually-hidden"></span>
            </div> Training
        `);

        // display epoch label and range
        $('#epoch-range').prop({
            'min': 0,
            'max': Object.keys(history).length - 1
        });
        document.getElementById('epoch-div').style.visibility = "visible";
        $('#epoch-label').html('Initialize Gaussian Mixture Model');
        $('#epoch-prob-label').html('');

        var epoch_range = document.getElementById("epoch-range");

        // display epoch
        var epoch = 0;
        function epochDisplay() {
            var histEpoch = history['epoch_' + epoch];
            if(epoch >= Object.keys(history).length - 2) {
                clearInterval(display_train_timer);
                document.getElementById("viterbi-div").style.visibility = "visible";
                $("#train_demo_btn").html(`Done`);
                
                // epoch history range
                epoch_range.addEventListener('input', (e)=>display_epoch_history(e, history));
            }
            // console.log(histEpoch);
            // show label
            $('#epoch-range').val(epoch + 1);
            $('#epoch-label').html('Epoch ' + (epoch + 1));
            $('#epoch-prob-label').html('Prob ' + Math.round(histEpoch.decode_log_prob * 100) / 100);
            
            // plot splited sequence
            plotDemoTrain('plot_demo_train', histEpoch.sequences, []);
            // plot model
            drawGMMs('demo_plot_div', {data:histEpoch});
            hmm_graphic_init({data:histEpoch}, demoCygraphic);
            // plot sequence splited point
            for(let s = 0;s < histEpoch.sequences.length; s++) {
                var y = [];
                for(let i = 0; i < histEpoch.sequences[s].length; i++) y.push(0)
                
                plotTrainHist({x: histEpoch.sequences[s], y:y}, `demo_plot_div_plot_${ s }`, s)
            }

            // plot viterbi

            epoch += 1;
        }
        display_train_timer = setInterval(epochDisplay, 1000);
    }
}

function display_epoch_history(e, history) {
    var index = document.getElementById('epoch-range').value;
    if(index == 0) {
        // display init
        $('#epoch-label').html('Initialize Gaussian Mixture Model');
        $('#epoch-prob-label').html('');
        
        var init = history['init'];
        // plot splited sequence
        plotDemoTrain('plot_demo_train', init.sequences, []);
        // plot model
        drawGMMs('demo_plot_div', {data:init});
        hmm_graphic_init({data:init}, demoCygraphic);
        // plot sequence splited point
        for(let s = 0;s < init.sequences.length; s++) {
            var y = [];
            for(let i = 0; i < init.sequences[s].length; i++) y.push(0)
            
            plotTrainHist({x: init.sequences[s], y:y}, `demo_plot_div_plot_${ s }`, s)
        }
    } else {
        var epoch = index - 1;
        var histEpoch = history['epoch_' + epoch];
        $('#epoch-label').html('Epoch ' + (epoch + 1));
        $('#epoch-prob-label').html('Prob ' + Math.round(histEpoch.decode_log_prob * 100) / 100);

        // plot splited sequence
        plotDemoTrain('plot_demo_train', histEpoch.sequences, []);
        // plot model
        drawGMMs('demo_plot_div', {data:histEpoch});
        hmm_graphic_init({data:histEpoch}, demoCygraphic);
        // plot sequence splited point
        for(let s = 0;s < histEpoch.sequences.length; s++) {
            var y = [];
            for(let i = 0; i < histEpoch.sequences[s].length; i++) y.push(0)
            
            plotTrainHist({x: histEpoch.sequences[s], y:y}, `demo_plot_div_plot_${ s }`, s)
        }
    }
    
}

function display_viterbi_handler(e, history) {
    var index = document.getElementById('epoch-range').value;
    var epoch = index - 1;
    if(epoch >= 0) drawViterbi(viterbiCygraphic, {data:history['epoch_' + epoch]});
}

var cygraphic        = null;
var demoCygraphic    = null;
var viterbiCygraphic = null;
var demoDatasets     = null;

var display_train_timer = null;


window.onload = function() {
    var generate_btn = document.getElementById('generate_btn');
    generate_btn.addEventListener('click', generate_handler);

    var train_demo_btn = document.getElementById('train_demo_btn');
    train_demo_btn.addEventListener('click', demoTrainingHandler);
    
    cygraphic     = getGraphic('hmm_iframe', 'cy')
    demoCygraphic = getGraphic('demo_hmm_iframe', 'cy');

    reload_graphic();

    hmmApi.get((data)=> {
        transition_table(data); 
        emission_table(data)
    }, console.log);

    getDemoTrainOption();
}