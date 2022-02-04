function Gaussian1D(gauss_mean, gauss_var, gauss_weight) {
    var x = [];
    var y = [];
    var xBegin = gauss_mean - 0.5;
    var xEnd   = gauss_mean + 0.5
                
    var nbiter=400;
    for(var i=0;i<nbiter;i++)
    {
        x[i] = xBegin + i * (xEnd - xBegin)/nbiter;
        y[i] = (1 / (gauss_var*Math.sqrt(2*Math.PI))) * Math.exp(-((x[i]-gauss_mean)*(x[i]-gauss_mean))/(2*gauss_var)) * gauss_weight;
    }
    return {x:x, y:y}
}

function GaussianMixture1D(gmm) {
    var x = [];
    var y = [];

    var xBegin = 0;
    var xEnd   = 0;
    
    for(let i = 0;i < gmm.means.length; i++){
        xBegin += gmm.means[i][0] * gmm.weights[i];    
    }
    xBegin = xBegin - 0.5;
    xEnd   = xBegin + 1.0;
                
    var nbiter=400;
    for(var i=0;i < nbiter;i++)
    {
        x[i] = xBegin + i * (xEnd - xBegin)/nbiter;
        y[i] = 0;
        for(var j = 0;j < gmm.means.length; j++) {
            var gauss_mean   = gmm.means[j][0];
            var gauss_var    = gmm.covariances[j][0];
            var gauss_weight = gmm.weights[j];
            y[i] += (1 / (gauss_var*Math.sqrt(2*Math.PI))) * Math.exp(-((x[i]-gauss_mean)*(x[i]-gauss_mean))/(2*gauss_var)) * gauss_weight;
        }
    }
    return {x:x, y:y}
}

function plotGMM(gmm, id) {
    var traces = [];
    for(let i = 0;i < gmm.means.length; i++){
        var data = Gaussian1D(gmm.means[i][0], gmm.covariances[i][0], gmm.weights[i]);
        traces.push({
            x: data.x,
            y: data.y,
            type: 'scatter',
            name:`mix ${ i }`
        })
    }
    var data = GaussianMixture1D(gmm);
    traces.push({
        x: data.x,
        y: data.y,
        marker: {color: "666"}, 
        type: 'scatter',
        name:`gmm`
    })
    gmmGraphics[id] = traces;
    Plotly.newPlot(id, traces);
}

export function plotTrainHist(data, id, state) {
    var sizes = [];
    for(let i = 0;i < data.x.length; i++) sizes.push(10);
    var trace1 = {
        x: data.x,
        // y: data.y,
        // mode: 'markers',
        type: 'histogram',
        marker: {
          size: sizes,
          opacity: 0.5,
          color: generated_color[state % generated_color.length]
        },
        name: 'obs seq'
      };
      gmmGraphics[id].push(trace1)
      Plotly.redraw(id, gmmGraphics[id]);
}

export function plotCircle(data, id) {
    var trace1 = {
        x: [data.x],
        y: [data.y],
        mode: 'markers',
        marker: {
          size: [10]
        }
      };
      gmmGraphics[id].push(trace1)
      Plotly.redraw(id, gmmGraphics[id]);
}

export function plotGenerate(id, value, state) {
    if(generated_value.s.length > 0){
        var x = generated_value.x.pop()
        var y = generated_value.y.pop()
        var s = generated_value.s.pop()

        generated_value.x.push(x);
        generated_value.y.push(y);
        generated_value.s.push(s);

        generated_value.x.push(generated_value_index + 1);
        generated_value.y.push(value);
        generated_value.s.push(state);

        if(s != state) {
            generated_values.push({
                x: generated_value.x,
                y: generated_value.y,
                type: 'scatter',
                name: `state ${ s }`,
                marker: {
                    opacity: 0.1,
                },
                line: {
                    color: generated_color[s % generated_color.length]
                }
            });
            
            // generated_value_index += 1;
            generated_value = {x: [generated_value_index + 1], y:[value], s:[state]};
        }
    } else {
        generated_value.x.push(generated_value_index + 1);
        generated_value.y.push(value);
        generated_value.s.push(state);
    }

    // generated_value.x.push(generated_value_index + 1);
    // generated_value.y.push(value);
    // generated_value.s.push(state);

    generated_value_index += 1;

    var generate = {
        x: generated_value.x,
        y: generated_value.y,
        type: 'scatter',
        name: `state ${ state }`,
        marker: {
            opacity: 0.1,
        },
        line: {
            color: generated_color[state % generated_color.length]
        }
      };
    generated_values.push(generate);
    Plotly.newPlot(id, generated_values);
    generated_values.pop();
}

var gmmGraphics = {};
var generated_value  = {x: [], y:[], s:[]};
var generated_values = [];
var generated_color = [
    'rgb(31, 119, 180)', 
    'rgb(255, 127, 14)', 
    'rgb(44, 160, 44)', 
    'rgb(214, 39, 40)', 
    'rgb(150, 103, 189)'
];
var generated_value_index = 0;

export function drawGMMs(id, data) {
    var gmms = data.data.emissions;

    for(let i = 0;i < gmms.length; i++){
        if(document.getElementById(id + `_plot_${ i }`) == null)
            $("#" + id)
                .append(`<div class="col-md-2"><div id=${ id }_plot_${ i } style="width:320px;height:300px;"></div></div>`);
        plotGMM(gmms[i], id + `_plot_${ i }`);
    }
}

export function gmm_graphic_init(data) {
    drawGMMs('plot_div', data);
}